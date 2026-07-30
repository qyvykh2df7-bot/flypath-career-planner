import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireWarhomeAdmin } from "@/lib/warhome/auth";
import {
  CONTENT_OS_BRAND_LIMITS,
  CONTENT_OS_BRAND_PRODUCTS,
  DEFAULT_CONTENT_OS_BRAND_PROFILE,
  type ContentOsBrandProduct,
  type ContentOsBrandProducts,
  type ContentOsBrandProfile,
  type ContentOsBrandProfileInput,
} from "@/lib/warhome/content-os-brand-contract";
import {
  CONTENT_OS_OBJECTIVES,
  type ContentOsObjective,
} from "@/lib/warhome/content-os-contract";
import { ContentOsDataError } from "@/lib/warhome/content-os";

const CONTENT_OS_WORKSPACE_KEY = "pilotfeliu";
const CONTENT_OS_BRAND_SELECT =
  "workspace_key,brand_name,brand_description,audiences,products,content_pillars,objectives,tone_style,tone_personality,tone_communication,tone_avoid,created_at,updated_at";

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" &&
    value.trim() &&
    value.length <= max
    ? value
    : null;
}

function timestamp(value: unknown): string | null {
  return typeof value === "string" &&
    Number.isFinite(new Date(value).getTime())
    ? value
    : null;
}

function stringList(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > CONTENT_OS_BRAND_LIMITS.listItems ||
    value.some(
      (entry) =>
        typeof entry !== "string" ||
        !entry.trim() ||
        entry.length > CONTENT_OS_BRAND_LIMITS.listItem,
    )
  ) {
    return null;
  }
  return [...new Set(value as string[])];
}

function products(value: unknown): ContentOsBrandProducts | null {
  if (!isRecord(value)) return null;
  const entries = CONTENT_OS_BRAND_PRODUCTS.map((product) => [
    product,
    text(value[product], CONTENT_OS_BRAND_LIMITS.productDescription),
  ] as const);
  if (entries.some(([, description]) => !description)) return null;
  return Object.fromEntries(entries) as ContentOsBrandProducts;
}

export function mapContentOsBrandProfile(
  value: unknown,
): ContentOsBrandProfile | null {
  const row = isRecord(value) ? value : null;
  if (!row || row.workspace_key !== CONTENT_OS_WORKSPACE_KEY) return null;
  const brandName = text(row.brand_name, CONTENT_OS_BRAND_LIMITS.name);
  const brandDescription = text(
    row.brand_description,
    CONTENT_OS_BRAND_LIMITS.description,
  );
  const audiences = stringList(row.audiences);
  const productContext = products(row.products);
  const contentPillars = stringList(row.content_pillars);
  const objectives = Array.isArray(row.objectives)
    ? row.objectives.filter(
        (value): value is ContentOsObjective =>
          typeof value === "string" &&
          CONTENT_OS_OBJECTIVES.includes(value as ContentOsObjective),
      )
    : [];
  const toneStyle = text(row.tone_style, CONTENT_OS_BRAND_LIMITS.toneField);
  const tonePersonality = text(
    row.tone_personality,
    CONTENT_OS_BRAND_LIMITS.toneField,
  );
  const toneCommunication = text(
    row.tone_communication,
    CONTENT_OS_BRAND_LIMITS.toneField,
  );
  const toneAvoid = text(row.tone_avoid, CONTENT_OS_BRAND_LIMITS.toneField);
  const createdAt = timestamp(row.created_at);
  const updatedAt = timestamp(row.updated_at);

  if (
    !brandName ||
    !brandDescription ||
    !audiences ||
    !productContext ||
    !contentPillars ||
    !objectives.length ||
    !toneStyle ||
    !tonePersonality ||
    !toneCommunication ||
    !toneAvoid ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    workspaceKey: CONTENT_OS_WORKSPACE_KEY,
    brandName,
    brandDescription,
    audiences,
    products: productContext,
    contentPillars,
    objectives,
    toneStyle,
    tonePersonality,
    toneCommunication,
    toneAvoid,
    createdAt,
    updatedAt,
  };
}

export async function loadContentOsBrandProfile(): Promise<ContentOsBrandProfile> {
  const { data, error } = await getSupabaseAdmin()
    .from("content_brand_profiles")
    .select(CONTENT_OS_BRAND_SELECT)
    .eq("workspace_key", CONTENT_OS_WORKSPACE_KEY)
    .maybeSingle();
  if (error) throw new ContentOsDataError();
  if (!data) return { ...DEFAULT_CONTENT_OS_BRAND_PROFILE };
  const profile = mapContentOsBrandProfile(data);
  if (!profile) throw new ContentOsDataError();
  return profile;
}

export async function getContentOsBrandProfile(): Promise<ContentOsBrandProfile> {
  await requireWarhomeAdmin();
  return loadContentOsBrandProfile();
}

export async function upsertContentOsBrandProfile(
  input: ContentOsBrandProfileInput,
): Promise<void> {
  const adminUser = await requireWarhomeAdmin();
  const { data, error } = await getSupabaseAdmin().rpc(
    "upsert_content_os_brand_profile",
    {
      p_admin_user_id: adminUser.userId,
      p_brand_name: input.brandName,
      p_brand_description: input.brandDescription,
      p_audiences: input.audiences,
      p_products: Object.fromEntries(
        CONTENT_OS_BRAND_PRODUCTS.map((product: ContentOsBrandProduct) => [
          product,
          input.products[product],
        ]),
      ),
      p_content_pillars: input.contentPillars,
      p_objectives: input.objectives,
      p_tone_style: input.toneStyle,
      p_tone_personality: input.tonePersonality,
      p_tone_communication: input.toneCommunication,
      p_tone_avoid: input.toneAvoid,
    },
  );
  if (error || data !== CONTENT_OS_WORKSPACE_KEY) throw new ContentOsDataError();
}
