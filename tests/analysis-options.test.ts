import { describe, expect, it } from "vitest";
import {
  AnalysisOptionsError,
  detectInputLanguage,
  resolveAnalysisOptions,
} from "../workers/src/analysis-options";

const indonesianScript = "Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya.";

describe("analysis options", () => {
  it("detects Indonesian and defaults to an Indonesian audience and output", () => {
    expect(detectInputLanguage(indonesianScript)).toBe("id");
    expect(resolveAnalysisOptions({ script_text: indonesianScript })).toEqual({
      input_language: "id",
      target_audience: "ID_GenZ",
      output_language: "id",
      platform: "tiktok",
    });
    expect(resolveAnalysisOptions({ script_text: "A bride reveals the contract at her wedding." }).platform).toBe("reels");
  });

  it("honors explicit language, audience, and platform selections", () => {
    expect(resolveAnalysisOptions({
      script_text: indonesianScript,
      input_language: "id",
      target_audience: "ID_Millennial",
      output_language: "en",
      platform: "tiktok",
    })).toEqual({
      input_language: "id",
      target_audience: "ID_Millennial",
      output_language: "en",
      platform: "tiktok",
    });
  });

  it.each([
    [{ input_language: "fr" }, "input_language"],
    [{ target_audience: "everyone" }, "target_audience"],
    [{ output_language: "EN" }, "output_language"],
    [{ platform: "x" }, "platform"],
  ])("rejects invalid options before AI is called", (payload, field) => {
    expect(() => resolveAnalysisOptions({ script_text: "A valid script opening", ...payload }))
      .toThrowError(new AnalysisOptionsError(field));
  });
});
