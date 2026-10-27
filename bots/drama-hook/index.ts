import type { BotBlueprint } from "../../workers/src/types";

export const dramaHook: BotBlueprint = {
  id: "bot:drama-hook-analyzer",
  name: "Drama Hook Analyzer",
  description:
    "分析短剧脚本前 3 秒钩子强度，输出 hook_score、改进建议与目标受众适配度。",
  agentCard: {
    name: "Drama Hook Analyzer",
    description: "分析短剧脚本前 3 秒钩子强度，输出 hook_score、改进建议与目标受众适配度。",
    version: "0.1.0",
    skills: [
      {
        id: "analyze_hook",
        name: "Analyze Short-Drama Hook",
        description: "评估短剧剧本开场钩子的强度并给出可执行改进建议。",
        tags: ["short-drama", "hook-analysis"],
      },
    ],
  },
  skills: [
    {
      id: "analyze_hook",
      name: "Analyze Short-Drama Hook",
      description: "评估短剧剧本开场钩子的强度并给出可执行改进建议。",
      inputSchema: {
        type: "object",
        required: ["script_text"],
        properties: {
          script_text: { type: "string" },
          target_audience: { type: "string", default: "US_GenZ" },
          output_language: { type: "string", default: "EN" },
          platform: { type: "string", enum: ["reels", "dramabox", "shortmax"], default: "reels" },
        },
      },
    },
  ],
  buildPrompt(payload) {
    return {
      system: [
        "You are Drama Hook Analyzer, a short-form drama script analyst.",
        "Focus on the first 3 seconds: emotional conflict, identity reveal, or shock value.",
        "Return STRICT JSON with shape:",
        '{"hook_score": number 0-100, "strengths": string[], "suggestions": string[], "audience_fit": string}',
        "Never add commentary outside the JSON.",
      ].join(" "),
      user: JSON.stringify({
        script_text: payload.script_text,
        target_audience: payload.target_audience ?? "US_GenZ",
        output_language: payload.output_language ?? "EN",
        platform: payload.platform ?? "reels",
      }),
    };
  },
};
