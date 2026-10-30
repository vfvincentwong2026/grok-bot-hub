export const INPUT_LANGUAGES = ["auto", "id", "en", "zh"] as const;
export const OUTPUT_LANGUAGES = ["id", "en", "zh"] as const;
export const TARGET_AUDIENCES = ["ID_GenZ", "ID_Millennial", "US_GenZ", "CN_GenZ"] as const;
export const PLATFORMS = ["tiktok", "reels", "youtube_shorts", "dramabox", "shortmax", "reelshort"] as const;
export const INDONESIAN_EXAMPLE = "Kamu bilang aku hanya seorang pelayan, tetapi aku adalah pewaris yang sebenarnya. Bukankah nama ku ada di surat wasiat ayahmu?";

export type DetectedLanguage = Exclude<(typeof INPUT_LANGUAGES)[number], "auto">;

export interface AnalysisOptions {
  input_language: DetectedLanguage;
  target_audience: (typeof TARGET_AUDIENCES)[number];
  output_language: (typeof OUTPUT_LANGUAGES)[number];
  platform: (typeof PLATFORMS)[number];
}

export class AnalysisOptionsError extends Error {
  constructor(readonly field: string) {
    super(`Invalid ${field}`);
    this.name = "AnalysisOptionsError";
  }
}

export function resolveAnalysisOptions(body: any): AnalysisOptions {
  const requestedInput = readEnum(body?.input_language, INPUT_LANGUAGES, "input_language") ?? "auto";
  const detectedInput = detectInputLanguage(String(body?.script_text ?? ""));
  const inputLanguage = requestedInput === "auto" ? detectedInput : requestedInput;
  const targetAudience = readEnum(body?.target_audience, TARGET_AUDIENCES, "target_audience")
    ?? (inputLanguage === "id" ? "ID_GenZ" : inputLanguage === "zh" ? "CN_GenZ" : "US_GenZ");
  const outputLanguage = readEnum(body?.output_language, OUTPUT_LANGUAGES, "output_language")
    ?? inputLanguage;
  const platform = readEnum(body?.platform, PLATFORMS, "platform") ?? (inputLanguage === "id" ? "tiktok" : "reels");

  return {
    input_language: inputLanguage,
    target_audience: targetAudience,
    output_language: outputLanguage,
    platform,
  };
}

export function detectInputLanguage(text: string): DetectedLanguage {
  if (/[\u3400-\u9fff]/u.test(text)) return "zh";

  const indonesianScore = countWords(text, [
    "yang", "dan", "di", "itu", "ini", "aku", "kamu", "dia", "tidak", "bukan",
    "dengan", "untuk", "dari", "pada", "adalah", "saya", "kau", "nya", "seorang",
  ]);
  if (indonesianScore > 0) return "id";
  return "en";
}

function countWords(text: string, words: string[]): number {
  const normalized = text.toLowerCase();
  return words.reduce((score, word) => {
    const matches = normalized.match(new RegExp(`\\b${word}\\b`, "gu"));
    return score + (matches?.length ?? 0);
  }, 0);
}

function readEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !allowed.includes(value)) throw new AnalysisOptionsError(field);
  return value;
}
