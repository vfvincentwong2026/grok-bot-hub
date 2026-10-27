import type { BotBlueprint } from "../../workers/src/types";

export const dmFunnel: BotBlueprint = {
  id: "bot:dm-funnel",
  name: "DM Funnel",
  description:
    "针对用户主动发起的 DM，生成个性化转化话术；拒绝任何未授权群发。",
  skills: [
    {
      id: "draft_reply",
      name: "Draft DM Reply",
      description: "基于用户主动消息上下文生成单条合规回复草稿。",
      inputSchema: {
        type: "object",
        required: ["incoming_message", "user_initiated"],
        properties: {
          incoming_message: { type: "string" },
          user_initiated: { type: "boolean", const: true },
          product_context: { type: "string" },
          tone: { type: "string", enum: ["friendly", "professional", "playful"], default: "friendly" },
        },
      },
    },
  ],
  buildPrompt(payload) {
    return {
      system: [
        "You are DM Funnel, a compliant conversational agent.",
        "Only draft a single reply to a user-initiated message.",
        "Never generate bulk DMs, never repeat identical text across users.",
        "Return STRICT JSON:",
        '{"reply": string, "cta": string, "disclosure": "automated"}',
      ].join(" "),
      user: JSON.stringify({
        incoming_message: payload.incoming_message,
        product_context: payload.product_context ?? "",
        tone: payload.tone ?? "friendly",
      }),
    };
  },
};
