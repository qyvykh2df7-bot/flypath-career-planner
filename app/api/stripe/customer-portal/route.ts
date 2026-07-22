import { NextResponse } from "next/server";
import {
  AeroCommsProCustomerPortalError,
  createAeroCommsProCustomerPortal,
} from "@/lib/commerce/aerocomms-pro-customer-portal";
import { StripeConfigurationError, StripeProviderError } from "@/lib/commerce/stripe";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 1_024;
const INVALID_REQUEST = "Solicitud de gestión de suscripción inválida.";
const AUTHENTICATION_REQUIRED = "Inicia sesión para gestionar tu suscripción.";
const SUBSCRIPTION_NOT_FOUND = "No encontramos una suscripción que puedas gestionar.";
const PORTAL_UNAVAILABLE = "No hemos podido abrir la gestión de tu suscripción. Inténtalo de nuevo.";

function logPortalUnavailable(error: AeroCommsProCustomerPortalError | StripeConfigurationError | StripeProviderError) {
  const diagnostic = error instanceof AeroCommsProCustomerPortalError
    ? `portal_${error.kind}`
    : error instanceof StripeConfigurationError
      ? `stripe_configuration_${error.issue}`
      : `stripe_provider_${error.issue}`;

  console.error(`[FlyPath] AeroComms Pro Customer Portal unavailable: ${diagnostic}.`);
}

async function parseEmptyRequest(request: Request): Promise<void> {
  const body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  if (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).length !== 0) {
    throw new Error("Invalid request body");
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: INVALID_REQUEST }, { status: 403 });

  try {
    await parseEmptyRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: INVALID_REQUEST },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }

  try {
    const portal = await createAeroCommsProCustomerPortal({ requestOrigin: getRequestOrigin(request) });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof AeroCommsProCustomerPortalError && error.kind === "authentication_required") {
      return NextResponse.json({ error: AUTHENTICATION_REQUIRED }, { status: 401 });
    }
    if (error instanceof AeroCommsProCustomerPortalError && error.kind === "subscription") {
      return NextResponse.json({ error: SUBSCRIPTION_NOT_FOUND }, { status: 404 });
    }
    if (
      error instanceof AeroCommsProCustomerPortalError
      || error instanceof StripeConfigurationError
      || error instanceof StripeProviderError
    ) {
      logPortalUnavailable(error);
      return NextResponse.json({ error: PORTAL_UNAVAILABLE }, { status: 503 });
    }

    console.error("[FlyPath] AeroComms Pro Customer Portal failed.");
    return NextResponse.json({ error: PORTAL_UNAVAILABLE }, { status: 500 });
  }
}
