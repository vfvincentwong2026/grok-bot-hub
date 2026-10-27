import { handleLeaderboard } from "./leaderboard";
import { checkXPolicy } from "./policy";

interface Env {
  AI: Ai;
  LEADERBOARD_KV: KVNamespace;
  XAI_API_KEY: string;
  XAI_BASE_URL: string;
  GROK_DEFAULT_MODEL: string;
  A2A_SHARED_SECRET: string;
  AI_GATEWAY_ID?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "grok-bot-hub" });
    }

    if (request.method === "GET" && url.pathname === "/v1/leaderboard") {
      return handleLeaderboard(env);
    }

    if (request.method === "POST" && url.pathname === "/v1/a2a/invoke") {
      return handleInvoke(request, env);
    }

    return json({ ok: false, error: "not_found" }, 404);
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

  const started = Date.now();

  // Route through Cloudflare AI Gateway to xAI
  // Chat Completions is deprecated; prefer /v1/responses on xAI
  const aiResp = await env.AI.run(
    `xai/${env.GROK_DEFAULT_MODEL}`,
    {
      messages: buildMessages(body),
    },
    { gateway: { id: env.AI_GATEWAY_ID ?? "default" } },
  );

  const latency_ms = Date.now() - started;

  return json({
    ok: true,
    protocol: "A2A-v1",
    bot: body.target_bot,
    result: aiResp,
    usage: { latency_ms },
  });
}

function buildMessages(body: any): any[] {
  return [
    { role: "system", content: `You are ${body.target_bot}. Follow X platform automation rules strictly.` },
    { role: "user", content: JSON.stringify(body.payload) },
  ];
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
