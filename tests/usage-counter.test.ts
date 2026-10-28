import { describe, expect, it } from "vitest";
import { UsageCounter } from "../workers/src/usage-counter";

function createCounter() {
  const values = new Map<string, unknown>();
  const state = {
    storage: {
      get: async (key: string) => values.get(key),
      put: async (key: string, value: unknown) => values.set(key, value),
    },
  };
  return new UsageCounter(state as any);
}

function request(operation: "consume" | "refund", limit = 1) {
  return new Request("https://usage.counter/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, limit }),
  });
}

describe("UsageCounter", () => {
  it("enforces the limit and refunds failed reservations", async () => {
    const counter = createCounter();
    const first = await (await counter.fetch(request("consume"))).json();
    const limited = await (await counter.fetch(request("consume"))).json();
    const refunded = await (await counter.fetch(request("refund"))).json();

    expect(first).toEqual({ ok: true, allowed: true, used: 1, remaining: 0 });
    expect(limited).toEqual({ ok: true, allowed: false, used: 1, remaining: 0 });
    expect(refunded).toEqual({ ok: true, allowed: true, used: 0, remaining: 1 });
  });
});
