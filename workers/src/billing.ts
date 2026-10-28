import { generateApiKey, hashApiKey } from "./api-keys";
import { getPaidPlan, getPriceIdEnv, type BillingInterval } from "./plans";

export interface BillingEnv {
  LEADERBOARD_KV: KVNamespace;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_CREATOR_MONTHLY?: string;
  STRIPE_PRICE_CREATOR_ANNUAL?: string;
  STRIPE_PRICE_STUDIO_MONTHLY?: string;
  STRIPE_PRICE_STUDIO_ANNUAL?: string;
}

export function isStripeConfigured(env: BillingEnv): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_PRICE_CREATOR_MONTHLY &&
      env.STRIPE_PRICE_CREATOR_ANNUAL &&
      env.STRIPE_PRICE_STUDIO_MONTHLY &&
      env.STRIPE_PRICE_STUDIO_ANNUAL,
  );
}

export async function handleCheckout(request: Request, env: BillingEnv): Promise<Response> {
  if (!isSameOrigin(request)) return json({ ok: false, error: "cross_origin_checkout_forbidden" }, 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const plan = getPaidPlan(body?.plan);
  const interval = body?.interval as BillingInterval;
  if (!plan || plan.id === "free" || !["monthly", "annual"].includes(interval)) {
    return json({ ok: false, error: "invalid_plan_or_interval" }, 400);
  }
  if (!isStripeConfigured(env)) return json({ ok: false, error: "billing_not_configured" }, 503);

  const priceId = getStripePriceId(env, plan.id, interval);
  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan.id,
    "metadata[billing_interval]": interval,
    success_url: `${origin}/?billing=success&session_id={CHECKOUT_SESSION_ID}#pricing`,
    cancel_url: `${origin}/?billing=cancelled#pricing`,
  });

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = (await response.json()) as any;
    if (!response.ok || typeof session?.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) {
      return json({ ok: false, error: "stripe_checkout_unavailable" }, 502);
    }
    return json({ ok: true, url: session.url });
  } catch {
    return json({ ok: false, error: "stripe_checkout_unavailable" }, 502);
  }
}

export async function handleCheckoutComplete(request: Request, env: BillingEnv): Promise<Response> {
  if (!isStripeConfigured(env)) return json({ ok: false, error: "billing_not_configured" }, 503);
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId) || sessionId.length > 200) {
    return json({ ok: false, error: "invalid_session_id" }, 400);
  }

  try {
    const params = new URLSearchParams({ "expand[]": "line_items" });
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?${params}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    const session = (await response.json()) as any;
    if (!response.ok) return json({ ok: false, error: "checkout_session_not_found" }, 404);
    if (session.status !== "complete" || session.payment_status !== "paid") {
      return json({ ok: false, error: "payment_not_complete" }, 402);
    }

    const plan = getPaidPlan(session?.metadata?.plan);
    const interval = session?.metadata?.billing_interval as BillingInterval;
    if (!plan || plan.id === "free" || !["monthly", "annual"].includes(interval)) {
      return json({ ok: false, error: "checkout_plan_mismatch" }, 400);
    }
    const expectedPrice = getStripePriceId(env, plan.id, interval);
    if (session?.line_items?.data?.[0]?.price?.id !== expectedPrice) {
      return json({ ok: false, error: "checkout_plan_mismatch" }, 400);
    }

    const existing = await env.LEADERBOARD_KV.get(`billing:session:${sessionId}`, "json");
    if (existing) {
      return json({ ok: true, already_issued: true, plan: plan.id, monthly_limit: plan.monthlyLimit });
    }

    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);
    const createdAt = new Date().toISOString();
    await env.LEADERBOARD_KV.put(
      `apikey:${keyHash}`,
      JSON.stringify({
        plan: plan.id,
        status: "active",
        created_at: createdAt,
        stripe_customer: session.customer,
        stripe_subscription: session.subscription,
        stripe_session: sessionId,
      }),
    );
    await env.LEADERBOARD_KV.put(
      `billing:session:${sessionId}`,
      JSON.stringify({ key_hash: keyHash, plan: plan.id, issued_at: createdAt }),
    );

    return json({ ok: true, api_key: apiKey, plan: plan.id, monthly_limit: plan.monthlyLimit });
  } catch {
    return json({ ok: false, error: "checkout_completion_unavailable" }, 502);
  }
}

function getStripePriceId(env: BillingEnv, plan: "creator" | "studio", interval: BillingInterval): string {
  const values = env as unknown as Record<string, string | undefined>;
  return values[getPriceIdEnv(plan, interval)]!;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
