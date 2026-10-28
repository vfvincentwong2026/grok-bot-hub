export class UsageCounter implements DurableObject {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const body = (await request.json()) as { operation?: string; limit?: number };
    const operation = body.operation;
    const limit = body.limit;
    if (!["consume", "refund"].includes(operation ?? "") || !Number.isInteger(limit) || (limit ?? 0) < 1) {
      return json({ ok: false, error: "invalid_counter_request" }, 400);
    }

    const current = (await this.state.storage.get<number>("used")) ?? 0;
    if (operation === "consume" && current >= limit!) {
      return json({ ok: true, allowed: false, used: current, remaining: 0 });
    }

    const used = operation === "consume" ? current + 1 : Math.max(0, current - 1);
    await this.state.storage.put("used", used);
    return json({ ok: true, allowed: true, used, remaining: Math.max(0, limit! - used) });
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
