import { AI_ATTRIBUTION } from "./attribution";
import { handleCheckout, handleCheckoutComplete, isStripeConfigured } from "./billing";
import { handleDemoInvoke } from "./demo";
import { renderHome } from "./home";
import { handleLeaderboard, recordMetric } from "./leaderboard";
import { renderLegalPage } from "./legal";
import { handlePaidInvoke } from "./paid";
import { checkXPolicy } from "./policy";
import { getAgentCards, getBot, listBots } from "./registry";

export { UsageCounter } from "./usage-counter";

interface Env {
  AI: Ai;
  LEADERBOARD_KV: KVNamespace;
  USAGE_COUNTER: DurableObjectNamespace;
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
  A2A_SHARED_SECRET: string;
  AI_GATEWAY_ID?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_CREATOR_IDR?: string;
  STRIPE_PRICE_STUDIO_IDR?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/pricing")) {
      return renderHome({ checkoutEnabled: isStripeConfigured(env) });
    }

    if (request.method === "GET" && ["/terms", "/privacy", "/refunds"].includes(url.pathname)) {
      return renderLegalPage(url.pathname.slice(1) as "terms" | "privacy" | "refunds");
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "grok-bot-hub" });
    }

    if (request.method === "GET" && url.pathname === "/v1/leaderboard") {
      return handleLeaderboard(env);
    }

    if (request.method === "GET" && url.pathname === "/v1/bots") {
      const language = url.searchParams.get("lang") ?? request.headers.get("Accept-Language");
      return json({ ok: true, bots: listBots(language) });
    }

    if (request.method === "GET" && url.pathname === "/.well-known/agent-card.json") {
      const language = url.searchParams.get("lang") ?? request.headers.get("Accept-Language");
      return json({ agents: getAgentCards(language) });
    }

    if (request.method === "POST" && url.pathname === "/v1/demo/invoke") {
      return handleDemoInvoke(request, env);
    }

    if (request.method === "POST" && url.pathname === "/v1/app/invoke") {
      return handlePaidInvoke(request, env);
    }

    if (request.method === "POST" && url.pathname === "/v1/billing/checkout") {
      return handleCheckout(request, env);
    }

    if (request.method === "GET" && url.pathname === "/v1/billing/complete") {
      return handleCheckoutComplete(request, env);
    }

    if (request.method === "POST" && url.pathname === "/v1/a2a/invoke") {
      const response = await handleInvoke(request, env);
      response.headers.set("Deprecation", "true");
      return response;
    }

    return json({ ok: false, error: "not_found" }, 404);
  },

  // Cron trigger handler for wrangler.toml `[triggers] crons = ["*/5 * * * *"]`.
  // docs/quickstart.md describes this as the scheduled leaderboard snapshot, but no
  // snapshot builder exists yet, so this is intentionally a safe heartbeat no-op:
  // no xAI calls, no KV writes, no fabricated data.
  async scheduled(controller: ScheduledController, _env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      console.log(
        JSON.stringify({
          event: "cron_heartbeat",
          cron: controller.cron,
          scheduled_time: new Date(controller.scheduledTime).toISOString(),
        }),
      );
    } catch (err) {
      console.error("scheduled handler error", err instanceof Error ? err.message : String(err));
    }
  },
};

async function handleInvoke(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.A2A_SHARED_SECRET}`) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (body?.protocol !== "A2A-v1" || !body?.target_bot) {
    return json({ ok: false, error: "invalid_a2a_request" }, 400);
  }

  // X compliance guard before any outbound action
  const policy = checkXPolicy(body);
  if (!policy.allowed) {
    return json({ ok: false, error: "x_policy_violation", reason: policy.reason }, 403);
  }

  const bot = getBot(body.target_bot);
  if (!bot) return json({ ok: false, error: "bot_not_found" }, 404);

  const started = Date.now();
  let aiResp: unknown;

  try {
    const { system, user } = bot.buildPrompt(body.payload ?? {});
    const messages = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const response = await fetch(`${env.XAI_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${env.XAI_API_KEY}`,
      },
      body: JSON.stringify({ model: env.GROK_DEFAULT_MODEL, input: messages }),
    });
    if (!response.ok) throw new Error(`xAI request failed with status ${response.status}`);
    aiResp = await response.json();
  } catch {
    const latency_ms = Date.now() - started;
    await recordMetric(env, bot.id, { latency_ms, ok: false });
    return json({ ok: false, error: "ai_invocation_failed" }, 500);
  }

  const latency_ms = Date.now() - started;
  await recordMetric(env, bot.id, { latency_ms, ok: true });

  return json({
    ok: true,
    protocol: "A2A-v1",
    bot: body.target_bot,
    result: aiResp,
    attribution: AI_ATTRIBUTION,
    usage: { latency_ms },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
