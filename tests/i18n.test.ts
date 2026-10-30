import { describe, expect, it } from "vitest";
import worker from "../workers/src/index";

describe("localized discovery", () => {
  it("returns Indonesian descriptions from the query string", async () => {
    const response = await worker.fetch(new Request("http://localhost/v1/bots?lang=id"), {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.bots).toHaveLength(2);
    expect(data.bots[0].description).toContain("Menganalisis");
  });

  it("returns Chinese descriptions from Accept-Language", async () => {
    const response = await worker.fetch(new Request("http://localhost/v1/bots", {
      headers: { "Accept-Language": "zh-CN,en;q=0.8" },
    }), {} as any);
    const data = await response.json();

    expect(data.bots[0].description).toContain("分析");
  });

  it("localizes Agent Card descriptions", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/.well-known/agent-card.json?lang=en"),
      {} as any,
    );
    const data = await response.json();

    expect(data.agents["bot:drama-hook-analyzer"].description).toContain("Analyzes");
    expect(data.agents["bot:drama-hook-analyzer"].skills[0].description).toContain("Scores");
  });
});
