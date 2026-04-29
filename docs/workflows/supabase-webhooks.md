# Supabase Webhooks — Setup Guide

## B12.4: Log Drain → Sentry

### What it does

Routes Supabase log events at level `warning` or `error` to Sentry via a Next.js route handler at `/api/webhooks/supabase-logs`.

- `error` events → `Sentry.captureException`
- `warning` events → `Sentry.captureMessage` (level: warning)
- `info` / `debug` events → silently ignored

### Environment variable

Add to your `.env.local` (dev) and Vercel environment (prod):

```
SUPABASE_WEBHOOK_SECRET=<random string, min 16 chars>
```

Generate one with: `openssl rand -base64 24`

### Supabase dashboard config

1. Go to **Project → Settings → API → Webhooks** (or **Integrations → Webhooks**).
2. Click **New Webhook**.
3. Set:
   - **Name:** `log-drain-sentry`
   - **URL:** `https://<your-domain>/api/webhooks/supabase-logs`
   - **Events:** select log event types you want forwarded (e.g. `log.warning`, `log.error`)
   - **HTTP Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer <SUPABASE_WEBHOOK_SECRET value>
     Content-Type: application/json
     ```

> Note: Supabase may send events as a single JSON object or as a JSON array. The handler accepts both.

### Expected payload shape

```json
{
  "id": "evt-abc123",
  "timestamp": "2026-04-28T22:00:00.000Z",
  "event_message": "Connection pool exhausted",
  "level": "error",
  "metadata": {
    "source": "postgres",
    "project_ref": "xyzxyz"
  }
}
```

Or an array of the above.

### Local testing

Use `curl` to test the endpoint locally (`pnpm dev` must be running):

```bash
curl -X POST http://localhost:3000/api/webhooks/supabase-logs \
  -H "Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-001",
    "timestamp": "2026-04-28T22:00:00.000Z",
    "event_message": "Test warning from Supabase",
    "level": "warning",
    "metadata": { "source": "auth" }
  }'
```

Expected response: `{"received":1,"dispatched":1}`

### Troubleshooting

| Response | Cause |
|----------|-------|
| 401 Unauthorized | `Authorization` header missing or wrong secret |
| 400 Invalid payload | Body doesn't match schema — check `level` is one of `debug/info/warning/error` |
| 503 Service unavailable | `SUPABASE_WEBHOOK_SECRET` env var not set on the server |
