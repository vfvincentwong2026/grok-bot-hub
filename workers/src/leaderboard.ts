interface Env {
  LEADERBOARD_KV: KVNamespace;
}

export async function handleLeaderboard(env: Env): Promise<Response> {
  const raw = await env.LEADERBOARD_KV.get("leaderboard:snapshot");
  if (!raw) {
    return json({ ok: true, updated_at: null, entries: [] });
  }
  return new Response(raw, {
    headers: { "content-type": "application/json" },
  });
}

export async function recordMetric(
  env: Env,
  bot: string,
  metric: { latency_ms: number; tokens?: number; ok: boolean },
): Promise<void> {
  const key = `metrics:${bot}`;
  const existing = (await env.LEADERBOARD_KV.get(key, "json")) as any | null;
  const next = {
    bot,
    calls: (existing?.calls ?? 0) + 1,
    failures: (existing?.failures ?? 0) + (metric.ok ? 0 : 1),
    total_latency_ms: (existing?.total_latency_ms ?? 0) + metric.latency_ms,
    total_tokens: (existing?.total_tokens ?? 0) + (metric.tokens ?? 0),
    last_seen: new Date().toISOString(),
  };
  await env.LEADERBOARD_KV.put(key, JSON.stringify(next));
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}
