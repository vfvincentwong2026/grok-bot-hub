import { describe, expect, it } from "vitest";
import worker from "../workers/src/index";

describe("GET /", () => {
  it("renders the registry homepage with bots and agent cards", async () => {
    const response = await worker.fetch(new Request("http://localhost/"), {} as any);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("GrokBotHub");
    expect(html).toContain("Drama Hook Analyzer");
    expect(html).toContain("Viral Radar");
    expect(html).toContain("DM Funnel");
    expect(html).toContain("Agent Card contracts");
    expect(html).toContain("Live leaderboard");
  });
});
