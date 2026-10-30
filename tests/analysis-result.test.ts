import { describe, expect, it } from "vitest";
import { extractOutputText, parseHookAnalysis } from "../workers/src/analysis-result";

const validAnalysis = {
  hook_score: 88,
  dimensions: { conflict: 90, identity_reveal: 85, curiosity_gap: 80, emotion: 88 },
  strengths: ["Fast conflict"],
  suggestions: ["Raise the stakes"],
  rewritten_hooks: ["One", "Two", "Three"],
  audience_fit: "Strong fit",
};

describe("hook analysis result", () => {
  it("validates the complete schema and attaches a receipt id", () => {
    const result = parseHookAnalysis(JSON.stringify(validAnalysis), "receipt-123");

    expect(result).toEqual({ ...validAnalysis, receipt_id: "receipt-123" });
  });

  it.each([
    [{ ...validAnalysis, rewritten_hooks: ["Only one"] }],
    [{ ...validAnalysis, dimensions: { conflict: 90 } }],
    [{ ...validAnalysis, hook_score: 101 }],
    [{ ...validAnalysis, audience_fit: "" }],
  ])("rejects incomplete or invalid model output", (value) => {
    expect(() => parseHookAnalysis(JSON.stringify(value), "receipt-123")).toThrow();
  });

  it("extracts Responses API output text", () => {
    expect(extractOutputText({ output_text: "hello" })).toBe("hello");
    expect(extractOutputText({
      output: [{ type: "message", content: [{ type: "output_text", text: "world" }] }],
    })).toBe("world");
  });
});
