export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

const BULK_KEYWORDS = ["bulk", "mass", "everyone", "all followers"];

export function checkXPolicy(body: any): PolicyResult {
  const payload = body?.payload ?? {};

  // 1. Reject unsolicited DM / reply blasts
  if (payload.action === "dm" || payload.action === "reply") {
    if (payload.user_initiated !== true) {
      return {
        allowed: false,
        reason: "X requires user-initiated interaction for automated replies/DMs.",
      };
    }
  }

  // 2. Reject cross-account identical content intent
  if (payload.cross_account === true) {
    return {
      allowed: false,
      reason: "Identical content across multiple accounts is treated as platform manipulation.",
    };
  }

  // 3. Reject bulk / spammy intent
  const text = String(payload.script_text ?? payload.text ?? "").toLowerCase();
  if (BULK_KEYWORDS.some((k) => text.includes(k))) {
    return { allowed: false, reason: "Bulk/aggressive targeting is prohibited by X automation rules." };
  }

  // 4. Require bot disclosure flag for any posting action
  if ((payload.action === "post" || payload.action === "quote") && payload.bot_disclosed !== true) {
    return {
      allowed: false,
      reason: "Automated accounts must disclose bot status in profile bio.",
    };
  }

  return { allowed: true };
}
