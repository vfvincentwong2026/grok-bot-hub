export interface HookAnalysis {
  hook_score: number;
  dimensions: {
    conflict: number;
    identity_reveal: number;
    curiosity_gap: number;
    emotion: number;
  };
  strengths: string[];
  suggestions: string[];
  rewritten_hooks: [string, string, string];
  audience_fit: string;
  receipt_id: string;
}

export function parseHookAnalysis(text: string, receiptId: string): HookAnalysis {
  const value = JSON.parse(text) as any;
  const dimensions = value?.dimensions;
  const scores = [value?.hook_score, dimensions?.conflict, dimensions?.identity_reveal, dimensions?.curiosity_gap, dimensions?.emotion];
  if (scores.some((score) => typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100)) {
    throw new Error("Invalid hook analysis scores");
  }
  if (!isStringArray(value?.strengths) || !isStringArray(value?.suggestions)) {
    throw new Error("Invalid hook analysis lists");
  }
  if (!isStringArray(value?.rewritten_hooks) || value.rewritten_hooks.length !== 3) {
    throw new Error("Hook analysis must contain three rewritten hooks");
  }
  if (typeof value?.audience_fit !== "string" || !value.audience_fit.trim()) {
    throw new Error("Invalid audience fit");
  }

  return {
    hook_score: value.hook_score,
    dimensions: {
      conflict: dimensions.conflict,
      identity_reveal: dimensions.identity_reveal,
      curiosity_gap: dimensions.curiosity_gap,
      emotion: dimensions.emotion,
    },
    strengths: value.strengths,
    suggestions: value.suggestions,
    rewritten_hooks: value.rewritten_hooks,
    audience_fit: value.audience_fit,
    receipt_id: receiptId,
  };
}

export function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string") return response.output_text;
  const output = Array.isArray(response?.output) ? response.output : [];
  const texts: string[] = [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  return texts.join("\n");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}
