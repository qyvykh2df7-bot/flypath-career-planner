import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getAdmin: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrieveInvoice: vi.fn(),
  retrieveCheckout: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("./stripe", () => ({
  getStripeClient: () => ({
    subscriptions: { retrieve: mocks.retrieveSubscription },
    invoices: { retrieve: mocks.retrieveInvoice },
    checkout: { sessions: { retrieve: mocks.retrieveCheckout } },
  }),
}));

import { processAeroCommsProStripeWebhook } from "./aerocomms-pro-stripe-webhooks";
import {
  AEROCOMMS_PRO_CATALOG,
  AEROCOMMS_PRO_LEGACY_CATALOG,
} from "./aerocomms-pro-catalog";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const orderId = "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const priceId = "8b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const userId = "9c42cc52-01fc-4d4c-b1cd-47109c5fb540";

function event(type: string, object: Record<string, unknown>) {
  return {
    id: `evt_${type.replaceAll(".", "_")}`,
    type,
    created: 1_700_000_000,
    data: { object },
  } as never;
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_aerocomms_pro",
    customer: "cus_aerocomms_pro",
    status: "active",
    cancel_at_period_end: false,
    metadata: {
      flypath_product_key: "aerocomms_pro",
      checkout_attempt_id: attemptId,
      order_id: orderId,
      product_price_id: priceId,
      flypath_user_id: userId,
    },
    items: {
      data: [{
        price: { id: AEROCOMMS_PRO_CATALOG.stripePriceId },
        current_period_start: 1_700_000_000,
        current_period_end: 1_700_086_400,
      }],
    },
    ...overrides,
  };
}

describe("AeroComms Pro Stripe webhook projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({ data: "processed", error: null });
    mocks.retrieveSubscription.mockResolvedValue(subscription());
  });

  it("projects a closed, signed subscription snapshot through the atomic RPC", async () => {
    await expect(processAeroCommsProStripeWebhook(event("customer.subscription.created", subscription()), "{}"))
      .resolves.toBe("processed");

    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_event_type: "customer.subscription.created",
      p_action: "subscription_sync",
      p_stripe_subscription_id: "sub_aerocomms_pro",
      p_stripe_customer_id: "cus_aerocomms_pro",
      p_checkout_attempt_id: attemptId,
      p_order_id: orderId,
      p_user_id: userId,
      p_product_price_id: priceId,
      p_subscription_status: "active",
      p_current_period_end: "2023-11-15T22:13:20.000Z",
    }));
  });

  it("maps cancellation at period end to canceling while preserving the paid period", async () => {
    await processAeroCommsProStripeWebhook(event("customer.subscription.updated", subscription({ cancel_at_period_end: true })), "{}");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_subscription_status: "canceling",
      p_cancel_at_period_end: true,
    }));
  });

  it("uses the invoice amount and currency for a payment failure grace transition", async () => {
    const invoice = {
      id: "in_failed",
      parent: { subscription_details: { subscription: "sub_aerocomms_pro" } },
      amount_due: 599,
      currency: "eur",
    };
    await expect(processAeroCommsProStripeWebhook(event("invoice.payment_failed", invoice), "{}"))
      .resolves.toBe("processed");
    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_aerocomms_pro");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_action: "invoice_payment_failed",
      p_amount: 599,
      p_currency: "eur",
      p_subscription_status: "active",
      p_checkout_attempt_id: null,
      p_user_id: null,
    }));
  });

  it("keeps passing the historical 7.37 EUR invoice amount for a legacy subscription", async () => {
    mocks.retrieveSubscription.mockResolvedValueOnce(subscription({
      items: { data: [{ price: { id: AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId }, current_period_end: 1_700_086_400 }] },
    }));

    await expect(processAeroCommsProStripeWebhook(event("invoice.paid", {
      id: "in_legacy_paid",
      parent: { subscription_details: { subscription: "sub_aerocomms_pro" } },
      amount_paid: 737,
      currency: "eur",
    }), "{}"))
      .resolves.toBe("processed");

    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_action: "invoice_paid",
      p_amount: 737,
    }));
  });

  it("uses a signed invoice relationship before revoking a refunded subscription", async () => {
    mocks.retrieveInvoice.mockResolvedValue({
      id: "in_paid",
      parent: { subscription_details: { subscription: "sub_aerocomms_pro" } },
    });
    await expect(processAeroCommsProStripeWebhook(event("charge.refunded", { id: "ch_refunded", invoice: "in_paid" }), "{}"))
      .resolves.toBe("processed");
    expect(mocks.retrieveInvoice).toHaveBeenCalledWith("in_paid");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_action: "revoke_refund",
      p_stripe_object_id: "ch_refunded",
    }));
  });

  it("rejects a valid Stripe event when the subscription price is outside the closed catalog", async () => {
    await expect(processAeroCommsProStripeWebhook(event("customer.subscription.created", subscription({
      items: { data: [{ price: { id: "price_other" }, current_period_end: 1_700_086_400 }] },
    })), "{}")).resolves.toBe("ignored");
    expect(mocks.rpc).toHaveBeenCalledWith("record_career_planner_stripe_webhook_ignored", expect.objectContaining({
      p_error_code: "subscription_validation_failed",
    }));
  });

  it("continues projecting events for an existing subscription on the legacy 7.37 EUR price", async () => {
    await expect(processAeroCommsProStripeWebhook(event("customer.subscription.updated", subscription({
      items: { data: [{ price: { id: AEROCOMMS_PRO_LEGACY_CATALOG.stripePriceId }, current_period_end: 1_700_086_400 }] },
    })), "{}"))
      .resolves.toBe("processed");
  });

  it("does not claim unrelated subscription events as AeroComms Pro", async () => {
    await expect(processAeroCommsProStripeWebhook(event("customer.subscription.created", subscription({ metadata: {} })), "{}"))
      .resolves.toBe("not_aerocomms");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("keeps duplicate delivery at the idempotent database boundary", async () => {
    mocks.rpc.mockResolvedValue({ data: "duplicate", error: null });
    await expect(processAeroCommsProStripeWebhook(event("customer.subscription.created", subscription()), "{}"))
      .resolves.toBe("processed");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_aerocomms_pro_subscription_webhook_event", expect.objectContaining({
      p_event_id: "evt_customer_subscription_created",
    }));
  });
});
