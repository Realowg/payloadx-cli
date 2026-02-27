# PayloadX CLI — Response Reference

## Find response

```json
{
  "docs": [ { "id": 1, "title": "...", ... } ],
  "totalDocs": 25,
  "limit": 10,
  "totalPages": 3,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

## Get response

Returns the document object directly:

```json
{ "id": 1, "title": "...", "createdAt": "...", "updatedAt": "..." }
```

## Write command response (create / update / delete)

All write commands wrap results in a journal summary:

```json
{
  "runId": "abc12345",
  "mode": "apply",
  "touched": 1,
  "succeeded": 1,
  "failed": 0,
  "errors": [],
  "journalPath": ".payloadx/runs/2026-02-27T00-00-00Z_create_abc12345.jsonl",
  "doc": { "id": 1, "title": "..." }
}
```

In dry-run mode (`mode: "dry-run"`), the response includes preview fields instead of `doc`:
- **create**: `wouldCreate: true`, `samplePayload: {...}`, optionally `file: "path"`
- **update**: `wouldUpdate: true`, `diff: [{ field, before, after }]`
- **delete**: `wouldDelete: true`, `existingDoc: {...}`

## Bulk update response

```json
{
  "runId": "...",
  "mode": "apply",
  "touched": 15,
  "succeeded": 15,
  "failed": 0,
  "errors": [],
  "journalPath": "..."
}
```

## Ping response

```json
{ "ok": true, "status": 200, "latencyMs": 142, "baseURL": "https://..." }
```

## Whoami response

```json
{ "authenticated": true, "user": { "id": 1, "email": "..." }, "collection": "users" }
```

## Error response (non-zero exit)

```json
{ "error": "Target appears to be production. Add --allow-prod.", "exitCode": 2 }
```

## Media upload response

When creating/updating in upload collections, the `doc` includes file metadata:

```json
{
  "doc": {
    "id": 10,
    "alt": "Hero image",
    "url": "/api/media/file/hero.png",
    "filename": "hero.png",
    "mimeType": "image/png",
    "filesize": 45000,
    "width": 1200,
    "height": 800,
    "sizes": {
      "thumbnail": { "url": "/api/media/file/hero-300x225.jpg", "width": 300, "height": 225 },
      "square": { "url": "...", "width": 500, "height": 500 }
    }
  }
}
```

## Auth header formats

API Key (exact, case-sensitive):
```
Authorization: <collectionSlug> API-Key <apiKey>
```

JWT:
```
Authorization: JWT <token>
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `PAYLOADX_BASE_URL` | Payload API base URL (e.g. `https://site.com/api`) |
| `PAYLOADX_API_KEY` | API key for authentication |
| `PAYLOADX_JWT` | JWT token (API key takes priority if both set) |
| `PAYLOADX_AUTH_COLLECTION` | Auth collection slug (default: `users`) |
| `PAYLOADX_PROFILE` | Config profile name |
| `PAYLOADX_ALLOW_PROD` | Set to `1` to allow production writes |

## Global flags

| Flag | Description |
|------|-------------|
| `--profile <name>` | Config profile |
| `--base-url <url>` | API base URL |
| `--auth-collection <slug>` | Auth collection |
| `--api-key <key>` | API key |
| `--jwt <token>` | JWT token |
| `--json` | JSON output to stdout |
| `--log-level <level>` | `silent\|error\|warn\|info\|debug` |
| `--out-dir <path>` | Journal directory (default `.payloadx`) |
| `--allow-prod` | Allow production writes |
| `--apply` | Execute writes |
| `--timeout <ms>` | Request timeout (default 30000) |
