import { describe, expect, it } from "vitest";
import { getBot, listBots } from "../workers/src/registry";

describe("bot registry", () => {
  it("returns a registered bot", () => {
    expect(getBot("bot:drama-hook-analyzer")?.name).toBe("Drama Hook Analyzer");
  });

  it("returns undefined for an unknown bot", () => {
    expect(getBot("bot:unknown")).toBeUndefined();
  });

  it("lists only public, non-DM bots", () => {
    const bots = listBots();

    expect(bots).toHaveLength(2);
    expect(bots.map((bot) => bot.id)).toEqual([
      "bot:drama-hook-analyzer",
      "bot:viral-radar",
    ]);
  });

  it("localizes bot descriptions in English, Indonesian, and Chinese", () => {
    expect(listBots("en")[0]?.description).toContain("Analyzes");
    expect(listBots("id")[0]?.description).toContain("Menganalisis");
    expect(listBots("zh")[0]?.description).toContain("分析");
    expect(listBots("id-ID,en;q=0.8")[0]?.description).toContain("Menganalisis");
  });
});
