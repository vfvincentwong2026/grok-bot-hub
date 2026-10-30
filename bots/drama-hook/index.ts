import type { BotBlueprint } from "../../workers/src/types";

export const dramaHook: BotBlueprint = {
  id: "bot:drama-hook-analyzer",
  name: "Drama Hook Analyzer",
  description: {
    en: "Analyzes the first 3 seconds of a short-drama script for hook strength, improvements, and audience fit.",
    id: "Menganalisis 3 detik pertama naskah drama pendek untuk kekuatan hook, perbaikan, dan kecocokan audiens.",
    zh: "分析短剧脚本前 3 秒钩子强度，输出 hook_score、改进建议与目标受众适配度。",
  },
  agentCard: {
    name: "Drama Hook Analyzer",
    description: {
      en: "Analyzes the first 3 seconds of a short-drama script for hook strength, improvements, and audience fit.",
      id: "Menganalisis 3 detik pertama naskah drama pendek untuk kekuatan hook, perbaikan, dan kecocokan audiens.",
      zh: "分析短剧脚本前 3 秒钩子强度，输出 hook_score、改进建议与目标受众适配度。",
    },
    version: "0.1.0",
    skills: [
      {
        id: "analyze_hook",
        name: "Analyze Short-Drama Hook",
        description: {
          en: "Scores an opening hook and returns actionable revision suggestions.",
          id: "Menilai hook pembuka dan memberikan saran revisi yang dapat diterapkan.",
          zh: "评估短剧剧本开场钩子的强度并给出可执行改进建议。",
        },
        tags: ["short-drama", "hook-analysis"],
      },
    ],
  },
  skills: [
    {
      id: "analyze_hook",
      name: "Analyze Short-Drama Hook",
      description: {
        en: "Scores an opening hook and returns actionable revision suggestions.",
        id: "Menilai hook pembuka dan memberikan saran revisi yang dapat diterapkan.",
        zh: "评估短剧剧本开场钩子的强度并给出可执行改进建议。",
      },
      inputSchema: {
        type: "object",
        required: ["script_text"],
        properties: {
          script_text: { type: "string", minLength: 10, maxLength: 1200 },
          input_language: { type: "string", enum: ["auto", "id", "en", "zh"], default: "auto" },
          target_audience: {
            type: "string",
            enum: ["ID_GenZ", "ID_Millennial", "US_GenZ", "CN_GenZ"],
          },
          output_language: { type: "string", enum: ["id", "en", "zh"] },
          platform: {
            type: "string",
            enum: ["tiktok", "reels", "youtube_shorts", "dramabox", "shortmax", "reelshort"],
            default: "reels",
          },
        },
      },
    },
  ],
  buildPrompt(payload) {
    return {
      system: [
        "You are Drama Hook Analyzer, a short-form drama script analyst.",
        "Focus on the first 3 seconds: emotional conflict, identity reveal, or shock value.",
        "Evaluate for the requested target audience and platform.",
        "Write every natural-language field in the requested output_language (id, en, or zh).",
        "Return STRICT JSON with shape:",
        '{"hook_score": number 0-100, "dimensions": {"conflict": number 0-100, "identity_reveal": number 0-100, "curiosity_gap": number 0-100, "emotion": number 0-100}, "strengths": string[], "suggestions": string[], "rewritten_hooks": [string, string, string], "audience_fit": string}',
        "Write exactly three rewritten_hooks in the requested output_language; make each substantially stronger than the source opening.",
        "Never add commentary outside the JSON.",
      ].join(" "),
      user: JSON.stringify({
        script_text: payload.script_text,
        input_language: payload.input_language ?? "auto",
        target_audience: payload.target_audience ?? "US_GenZ",
        output_language: payload.output_language ?? "en",
        platform: payload.platform ?? "reels",
      }),
    };
  },
};
