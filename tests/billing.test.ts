import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../workers/src/index";

function createEnv(configured = true) {
  const store = new Map<string, string>();
  const env = {
    LEADERBOARD_KV: {
      get: vi.fn(async (key: string, type?: string) => {
        const value = store.get(key) ?? null;
        return type === "json" && value !== null ? JSON.parse(value) : value;
      }),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    },
    STRIPE_SECRET_KEY: configured ? "sk_test_123" : undefined,
    STRIPE_PRICE_CREATOR_MONTHLY: configured ? "price_creator_monthly" : undefined,
    STRIPE_PRICE_CREATOR_ANNUAL: configured ? "price_creator_annual" : undefined,
    STRIPE_PRICE_STUDIO_MONTHLY: configured ? "price_studio_monthly" : undefined,
    STRIPE_PRICE_STUDIO_ANNUAL: configured ? "price_studio_annual" : undefined,
  };
  return { env, store };
}

function checkout(env: ReturnType<typeof createEnv>["env"], plan = "creator", interval = "monthly") {
  return worker.fetch(
    new Request("http://localhost/v1/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ plan, interval }),
    }),
    env as any,
  );
}

function paidSession() {
  return {
    id: "cs_test_123",
    status: "complete",
    payment_status: "paid",
    customer: "cus_123",
    subscription: "sub_123",
    metadata: { plan: "creator", billing_interval: "monthly" },
    line_items: { data: [{ price: { id: "price_creator_monthly" } }] },
  };
}

describe("billing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 503 instead of simulating checkout when Stripe is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { env } = createEnv(false);
    const response = await checkout(env);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "billing_not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a Stripe subscription checkout with the selected price", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { env } = createEnv();
    const response = await checkout(env, "studio", "annual");
    const [, options] = fetchMock.mock.calls[0]!;
    const params = new URLSearchParams(String(options?.body));

    expect(response.status).toBe(200);
    expect(params.get("mode")).toBe("subscription");
    expect(params.get("line_items[0][price]")).toBe("price_studio_annual");
    expect(params.get("metadata[plan]")).toBe("studio");
    expect(params.get("metadata[billing_interval]")).toBe("annual");
  });

  it("verifies payment and issues a hashed API key only once", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        new Response(JSON.stringify(paidSession()), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const { env, store } = createEnv();
    const request = () => worker.fetch(
      new Request("http://localhost/v1/billing/complete?session_id=cs_test_123"),
      env as any,
    );

    const first = await request();
    const data = await first.json();
    expect(first.status).toBe(200);
    expect(data).toEqual(expect.objectContaining({ ok: true, plan: "creator", monthly_limit: 1000 }));
    expect(data.api_key).toMatch(/^gbh_/);

    const keyEntry = [...store.entries()].find(([key]) => key.startsWith("apikey:"));
    expect(keyEntry).toBeDefined();
    expect(keyEntry![1]).not.toContain(data.api_key);
    expect(JSON.parse(keyEntry![1])).toEqual(expect.objectContaining({ plan: "creator", status: "active" }));

    const second = await request();
    const repeated = await second.json();
    expect(repeated).toEqual({ ok: true, already_issued: true, plan: "creator", monthly_limit: 1000 });
    expect(repeated.api_key).toBeUndefined();
  });
});
