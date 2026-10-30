# X Compliance Notes

This project does not scrape X, use browser automation, auto-post, auto-DM, auto-reply, or auto-follow. Analysis uses only caller-provided text or samples.

## Enforced by `workers/src/policy.ts`

- Automated DM and reply actions are always rejected; a caller's self-reported `user_initiated` field cannot authorize them.
- Cross-account identical-content intent is rejected.
- Bulk/spam phrases are matched with word boundaries so words such as `massive` do not trigger a false positive.
- Posting and quote actions require an explicit bot-disclosure flag, although no publishing integration is currently implemented.

## Operating requirements

- Keep publishing as a human-reviewed draft workflow.
- Disclose automation where a platform requires it.
- Do not run bulk engagement or repeated identical messages.
- Preserve human review and a manual stop path.

## Reference

- X Automation Rules: https://help.x.com/en/rules-and-policies/x-automation
