export const CLIENT_EVENTS = ["landing_view", "demo_start", "rewrite_copy", "install_click", "upgrade_view"] as const;
export const SERVER_EVENTS = ["demo_done", "first_real_call", "checkout_start", "paid"] as const;

type ClientEvent = (typeof CLIENT_EVENTS)[number];
type ServerEvent = (typeof SERVER_EVENTS)[number];
type EventName = ClientEvent | ServerEvent;

interface EventEnv {
  LEADERBOARD_KV: KVNamespace;
}

interface EventProperties {
  duration_ms?: number;
  script_hash?: string;
  install_method?: "grok_bot" | "mcp" | "api";
  plan?: "free" | "creator" | "studio";
}

const EVENT_RETENTION_SECONDS = 90 * 86400;
const CLIENT_PROPERTY_KEYS = ["duration_ms", "script_hash", "install_method", "plan"] as const;

export async function handleEvent(request: Request, env: EventEnv): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: "cross_origin_event_forbidden" }, 403);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (!CLIENT_EVENTS.includes(body?.event)) {
    return json({ ok: false, error: "invalid_event" }, 400);
  }
  const allowedKeys = new Set(["event", ...CLIENT_PROPERTY_KEYS]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
    return json({ ok: false, error: "unsupported_event_property" }, 400);
  }

  try {
    await recordFirstPartyEvent(env, body.event, body);
    return json({ ok: true }, 202);
  } catch (error) {
    if (error instanceof EventValidationError) {
      return json({ ok: false, error: "invalid_event_property", field: error.field }, 400);
    }
    throw error;
  }
}

export async function recordFirstPartyEvent(
  env: EventEnv,
  event: EventName,
  properties: EventProperties = {},
): Promise<void> {
  const record: Record<string, string | number> = {
    version: 1,
    event,
    occurred_at: new Date().toISOString(),
  };

  if (properties.duration_ms !== undefined) {
    if (!Number.isFinite(properties.duration_ms) || properties.duration_ms < 0 || properties.duration_ms > 120000) {
      throw new EventValidationError("duration_ms");
    }
    record.duration_ms = Math.round(properties.duration_ms);
  }
  if (properties.script_hash !== undefined) {
    if (!/^[a-f0-9]{64}$/.test(properties.script_hash)) throw new EventValidationError("script_hash");
    record.script_hash = properties.script_hash;
  }
  if (properties.install_method !== undefined) {
    if (!["grok_bot", "mcp", "api"].includes(properties.install_method)) {
      throw new EventValidationError("install_method");
    }
    record.install_method = properties.install_method;
  }
  if (properties.plan !== undefined) {
    if (!["free", "creator", "studio"].includes(properties.plan)) throw new EventValidationError("plan");
    record.plan = properties.plan;
  }

  const key = `analytics:${Date.now()}:${crypto.randomUUID()}`;
  await env.LEADERBOARD_KV.put(key, JSON.stringify(record), { expirationTtl: EVENT_RETENTION_SECONDS });
}

export async function recordFirstRealCall(
  env: EventEnv,
  keyHash: string,
  scriptHash: string,
): Promise<void> {
  const activationKey = `analytics:activated:${keyHash}`;
  if (await env.LEADERBOARD_KV.get(activationKey)) return;
  await env.LEADERBOARD_KV.put(activationKey, new Date().toISOString(), { expirationTtl: EVENT_RETENTION_SECONDS });
  await recordFirstPartyEvent(env, "first_real_call", { script_hash: scriptHash });
}

export async function hashScriptText(scriptText: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scriptText));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const analyticsScript = `
    window.gbhTrack = function (event, properties) {
      try {
        fetch("/v1/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(Object.assign({ event: event }, properties || {})),
          keepalive: true
        }).catch(function () {});
      } catch {}
    };
`;

class EventValidationError extends Error {
  constructor(readonly field: string) {
    super(`Invalid ${field}`);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
