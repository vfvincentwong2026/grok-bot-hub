import type { BotBlueprint } from "../../workers/src/types";

export const viralRadar: BotBlueprint = {
  id: "bot:viral-radar",
  name: "Viral Radar",
  description:
    "基于给定关键词/样本，输出 X 与短视频平台的趋势信号与内容机会。",
  agentCard: {
    name: "Viral Radar",
    description: "基于给定关键词/样本，输出 X 与短视频平台的趋势信号与内容机会。",
    version: "0.1.0",
    skills: [
      {
        id: "scan_trends",
        name: "Scan Trend Signals",
        description: "从提供的样本文本中提炼趋势主题、情绪极性与内容机会。",
        tags: ["trends", "content-intelligence"],
      },
    ],
  },
  skills: [
    {
      id: "scan_trends",
      name: "Scan Trend Signals",
      description: "从提供的样本文本中提炼趋势主题、情绪极性与内容机会。",
      inputSchema: {
        type: "object",
        required: ["samples"],
        properties: {
          samples: { type: "array", items: { type: "string" } },
          niche: { type: "string", default: "short-drama" },
          region: { type: "string", default: "US" },
        },
      },
    },
  ],
  buildPrompt(payload) {
    return {
      system: [
        "You are Viral Radar, a trend intelligence agent.",
        "You MUST NOT scrape X or any platform; only analyze the samples provided.",
        "Return STRICT JSON:",
        '{"themes": string[], "sentiment": "positive"|"neutral"|"negative", "opportunities": string[], "risk_flags": string[]}',
      ].join(" "),
      user: JSON.stringify({
        samples: payload.samples,
        niche: payload.niche ?? "short-drama",
        region: payload.region ?? "US",
      }),
    };
  },
};
