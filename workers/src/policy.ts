export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

const BULK_PATTERNS = [/\bbulk\b/iu, /\bmass\b/iu, /\beveryone\b/iu, /\ball followers\b/iu];

export function checkXPolicy(body: any): PolicyResult {
  const payload = body?.payload ?? {};

  // Automated DM/reply actions are disabled. A caller cannot authorize them by self-reporting.
  if (payload.action === "dm" || payload.action === "reply") {
    return {
      allowed: false,
      reason: "Automated DM/reply actions are disabled; only human-reviewed drafts are allowed.",
    };
  }

  // Reject cross-account identical content intent.
  if (payload.cross_account === true) {
    return {
      allowed: false,
      reason: "Identical content across multiple accounts is treated as platform manipulation.",
    };
  }

  // Match complete words/phrases so words such as "massive" are not false positives.
  const text = String(payload.script_text ?? payload.text ?? "").toLowerCase();
  if (BULK_PATTERNS.some((pattern) => pattern.test(text))) {
    return { allowed: false, reason: "Bulk/aggressive targeting is prohibited by X automation rules." };
  }

  // Require bot disclosure flag for any posting action.
  if ((payload.action === "post" || payload.action === "quote") && payload.bot_disclosed !== true) {
    return {
      allowed: false,
      reason: "Automated accounts must disclose bot status in profile bio.",
    };
  }

  return { allowed: true };
}
