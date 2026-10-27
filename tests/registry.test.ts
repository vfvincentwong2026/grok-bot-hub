import { describe, expect, it } from "vitest";
import { getBot, listBots } from "../workers/src/registry";

describe("bot registry", () => {
  it("returns a registered bot", () => {
    expect(getBot("bot:drama-hook-analyzer")?.name).toBe("Drama Hook Analyzer");
  });

  it("returns undefined for an unknown bot", () => {
    expect(getBot("bot:unknown")).toBeUndefined();
  });

  it("lists all three bots", () => {
    const bots = listBots();

    expect(bots).toHaveLength(3);
    expect(bots.map((bot) => bot.id)).toEqual([
      "bot:drama-hook-analyzer",
      "bot:viral-radar",
      "bot:dm-funnel",
    ]);
  });
});
