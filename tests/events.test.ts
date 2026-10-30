import { describe, expect, it, vi } from "vitest";
import worker from "../workers/src/index";

function createEnv() {
  const store = new Map<string, string>();
  const env = {
    LEADERBOARD_KV: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    },
  };
  return { env, store };
}

function sendEvent(env: any, body: Record<string, unknown>, origin = "http://localhost") {
  return worker.fetch(new Request("http://localhost/v1/events", {
    method: "POST",
    headers: { "content-type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  }), env);
}

describe("POST /v1/events", () => {
  it("stores an allowed first-party event without script text", async () => {
    const { env, store } = createEnv();
    const response = await sendEvent(env, {
      event: "rewrite_copy",
      script_hash: "a".repeat(64),
    });

    expect(response.status).toBe(202);
    const [entry] = [...store.entries()];
    expect(entry).toBeDefined();
    expect(entry![0]).toMatch(/^analytics:\d+:/);
    expect(JSON.parse(entry![1])).toEqual(expect.objectContaining({
      event: "rewrite_copy",
      script_hash: "a".repeat(64),
      occurred_at: expect.any(String),
    }));
  });

  it("does not allow browsers to fabricate server-side payment events", async () => {
    const { env, store } = createEnv();
    const response = await sendEvent(env, { event: "paid", plan: "studio" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_event" });
    expect(store.size).toBe(0);
  });

  it("rejects raw script and unsupported properties", async () => {
    const { env, store } = createEnv();
    const response = await sendEvent(env, {
      event: "demo_start",
      script_text: "Do not store this opening",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "unsupported_event_property" });
    expect(store.size).toBe(0);
  });

  it("validates event properties", async () => {
    const { env, store } = createEnv();
    const response = await sendEvent(env, { event: "demo_done", duration_ms: -1 });

    expect(response.status).toBe(400);
    expect(store.size).toBe(0);
  });

  it("rejects cross-origin event writes", async () => {
    const { env, store } = createEnv();
    const response = await sendEvent(env, { event: "landing_view" }, "https://attacker.example");

    expect(response.status).toBe(403);
    expect(store.size).toBe(0);
  });
});
