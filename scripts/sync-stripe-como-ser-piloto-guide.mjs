import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_KEY = "como_ser_piloto_guide";
const PRICE_KEY = "como_ser_piloto_guide_eur";
const UNIT_AMOUNT = 1495;
const CURRENCY = "eur";
const PRODUCT_IMAGE_URL = "https://flypath.es/kindleguia.webp";

function loadLocalEnvironment() {
  const path = resolve(process.cwd(), ".env.local");
  let content = "";
  try {
    content = readFileSync(path, "utf8");
  } catch {
    // CI can provide the same values through the process environment.
  }

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function assertTestKey(value) {
  if (!value.startsWith("sk_test_")) {
    throw new Error("Stripe sync requires a sandbox test key");
  }
}

function isMatchingPrice(price) {
  return price.active
    && price.currency === CURRENCY
    && price.unit_amount === UNIT_AMOUNT
    && price.type === "one_time"
    && price.recurring === null;
}

async function findOrCreateStripeProduct(stripe) {
  const matches = [];
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (product.metadata.flypath_product_key === PRODUCT_KEY) matches.push(product);
  }
  if (matches.length > 1) throw new Error("Multiple Stripe products match the FlyPath guide product key");
  if (matches.length === 1) return { product: matches[0], created: false };

  return {
    product: await stripe.products.create({
      name: "Cómo ser Piloto",
      description: "Guía digital FlyPath para entender las rutas, requisitos y costes de formación de piloto.",
      images: [PRODUCT_IMAGE_URL],
      metadata: { flypath_product_key: PRODUCT_KEY },
    }, { idempotencyKey: `flypath:product:${PRODUCT_KEY}` }),
    created: true,
  };
}

async function findOrCreateStripePrice(stripe, productId) {
  const prices = await stripe.prices.list({ product: productId, active: true, type: "one_time", limit: 100 });
  const matching = prices.data.filter(isMatchingPrice);
  if (matching.length > 1) throw new Error("Multiple compatible Stripe prices exist for Cómo ser Piloto");
  if (matching.length === 1) return { price: matching[0], created: false };

  return {
    price: await stripe.prices.create({
      product: productId,
      currency: CURRENCY,
      unit_amount: UNIT_AMOUNT,
      metadata: { flypath_product_key: PRODUCT_KEY, flypath_price_key: PRICE_KEY },
    }, { idempotencyKey: `flypath:price:${productId}:${PRICE_KEY}` }),
    created: true,
  };
}

async function findExistingInternalPrice(supabase) {
  const { data: price, error } = await supabase
    .from("product_prices")
    .select("id,stripe_product_id,stripe_price_id")
    .eq("price_key", PRICE_KEY)
    .maybeSingle();
  if (error) throw new Error("Could not read the internal guide price");
  if (!price) return null;
  if (!price.stripe_product_id || !price.stripe_price_id) {
    throw new Error("Existing internal guide price has no complete Stripe linkage");
  }
  return price;
}

async function resolveLinkedStripeCatalog(stripe, internalPrice) {
  const [product, price] = await Promise.all([
    stripe.products.retrieve(internalPrice.stripe_product_id),
    stripe.prices.retrieve(internalPrice.stripe_price_id),
  ]);
  if (
    product.deleted ||
    !product.active ||
    product.metadata.flypath_product_key !== PRODUCT_KEY ||
    !isMatchingPrice(price) ||
    price.product !== product.id ||
    price.metadata.flypath_product_key !== PRODUCT_KEY ||
    price.metadata.flypath_price_key !== PRICE_KEY
  ) {
    throw new Error("Existing Stripe catalog linkage conflicts with the approved guide catalog");
  }
  return { product, price };
}

async function syncInternalCatalog(supabase, stripeProductId, stripePriceId) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,product_key,status")
    .eq("product_key", PRODUCT_KEY)
    .maybeSingle();
  if (productError || !product || product.status !== "active") {
    throw new Error("The internal guide product is unavailable or ambiguous");
  }

  const { data: existingPrice, error: existingPriceError } = await supabase
    .from("product_prices")
    .select("id,product_id,price_key,currency,unit_amount,billing_type,billing_interval,interval_count,stripe_product_id,stripe_price_id,is_active")
    .eq("price_key", PRICE_KEY)
    .maybeSingle();
  if (existingPriceError) throw new Error("Could not read the internal guide price");

  if (existingPrice) {
    const compatible =
      existingPrice.product_id === product.id &&
      existingPrice.currency === "EUR" &&
      existingPrice.unit_amount === UNIT_AMOUNT &&
      existingPrice.billing_type === "one_time" &&
      existingPrice.billing_interval === null &&
      existingPrice.interval_count === null &&
      existingPrice.stripe_product_id === stripeProductId &&
      existingPrice.stripe_price_id === stripePriceId &&
      existingPrice.is_active === true;
    if (!compatible) throw new Error("Existing internal guide price conflicts with the approved catalog");
    return { id: existingPrice.id, created: false };
  }

  const { data: insertedPrice, error: insertError } = await supabase
    .from("product_prices")
    .insert({
      product_id: product.id,
      price_key: PRICE_KEY,
      currency: "EUR",
      unit_amount: UNIT_AMOUNT,
      billing_type: "one_time",
      billing_interval: null,
      interval_count: null,
      tax_behavior: "unspecified",
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      is_active: true,
    })
    .select("id")
    .single();
  if (insertError || !insertedPrice) throw new Error("Could not create the internal guide price");
  return { id: insertedPrice.id, created: true };
}

async function main() {
  loadLocalEnvironment();
  const stripeKey = required("STRIPE_SECRET_KEY");
  assertTestKey(stripeKey);
  const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

  const existingInternalPrice = await findExistingInternalPrice(supabase);
  const linkedCatalog = existingInternalPrice ? await resolveLinkedStripeCatalog(stripe, existingInternalPrice) : null;
  const productResult = linkedCatalog
    ? { product: linkedCatalog.product, created: false }
    : await findOrCreateStripeProduct(stripe);
  const priceResult = linkedCatalog
    ? { price: linkedCatalog.price, created: false }
    : await findOrCreateStripePrice(stripe, productResult.product.id);
  const internalPriceResult = await syncInternalCatalog(supabase, productResult.product.id, priceResult.price.id);

  console.log(JSON.stringify({
    mode: "test",
    stripeProduct: productResult.created ? "created" : "reused",
    stripePrice: priceResult.created ? "created" : "reused",
    internalPrice: internalPriceResult.created ? "created" : "reused",
    stripe_product_id: productResult.product.id,
    stripe_price_id: priceResult.price.id,
    product_price_id: internalPriceResult.id,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Stripe catalog sync failed");
  process.exitCode = 1;
});
