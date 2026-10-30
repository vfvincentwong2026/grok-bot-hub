import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../workers/src/index";

describe("scheduled() cron handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is exported on the default worker", () => {
    expect(typeof worker.scheduled).toBe("function");
  });

  it("runs without throwing, without network calls or KV writes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const env = {
      LEADERBOARD_KV: { get: vi.fn(), put: vi.fn() },
    };
    const controller = {
      cron: "*/5 * * * *",
      scheduledTime: Date.UTC(2026, 9, 30, 15, 45),
      noRetry: vi.fn(),
    };
    const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };

    await expect(
      worker.scheduled(controller as any, env as any, ctx as any),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(env.LEADERBOARD_KV.put).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("cron_heartbeat"));
  });
});
