# Legacy custom A2A-v1 compatibility route

> `A2A-v1` is a project-specific JSON format, not the official Agent2Agent protocol. `POST /v1/a2a/invoke` is deprecated and returns `Deprecation: true`; use `/v1/app/invoke` for paid hook analysis.

## Request

```json
{
  "protocol": "A2A-v1",
  "target_bot": "bot:drama-hook-analyzer",
  "payload": {
    "script_text": "The maid reveals she is the true heir at the wedding."
  }
}
```

Authentication uses `Authorization: Bearer $A2A_SHARED_SECRET`.

## Successful response

```json
{
  "ok": true,
  "protocol": "A2A-v1",
  "bot": "bot:drama-hook-analyzer",
  "result": {},
  "attribution": "AI-generated with Grok. Review before publishing.",
  "usage": { "latency_ms": 412 }
}
```

## Errors

| Code | HTTP | Meaning |
| --- | ---: | --- |
| `unauthorized` | 401 | Shared secret does not match |
| `invalid_json` | 400 | Request body is not JSON |
| `invalid_a2a_request` | 400 | Custom protocol or target bot is missing |
| `x_policy_violation` | 403 | Policy guard rejected the request |
| `bot_not_found` | 404 | Bot is not publicly registered |
| `ai_invocation_failed` | 500 | Upstream AI invocation failed |

## Discovery

- `GET /v1/bots?lang=en|id|zh` returns public bot summaries.
- `GET /.well-known/agent-card.json?lang=en|id|zh` returns localized legacy discovery cards.
- `Accept-Language` is used when `lang` is absent; English is the fallback.

See [`x-compliance.md`](./x-compliance.md) for the current policy guard.
