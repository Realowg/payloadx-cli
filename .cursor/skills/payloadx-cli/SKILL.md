---
name: payloadx-cli
description: Operate Payload CMS instances via the payloadx CLI. Use when reading, creating, updating, deleting, or uploading content to a Payload CMS site, managing media/images, querying collections, or automating Payload content workflows.
---

# PayloadX CLI

Non-interactive CLI for Payload CMS REST API. Installed as `payloadx-cli`, binary is `payloadx`.

## Setup

```bash
npm i -g payloadx-cli
```

Required env vars (set before any command):

```bash
export PAYLOADX_BASE_URL="https://your-site.com/api"
export PAYLOADX_API_KEY="your-api-key"
export PAYLOADX_AUTH_COLLECTION="users"  # default, omit if "users"
```

## Rules for agents

1. **Always** append `--json` to get machine-readable stdout.
2. **Never** pass secrets via CLI flags — use env vars.
3. Write commands (`create`, `update`, `delete`, `bulk-update`, `upsert`) are **dry-run by default**. Add `--apply` to execute.
4. If the target is production, also add `--allow-prod` (or `PAYLOADX_ALLOW_PROD=1`).
5. Parse stdout as JSON. On non-zero exit, stdout contains `{ "error": "...", "exitCode": N }`.
6. Logs go to stderr; stdout is reserved for JSON output.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 2 | Validation/config error |
| 3 | Auth error (401/403) |
| 4 | Network error |
| 5 | Server error (5xx) |
| 6 | Partial failure (bulk) |

## Commands

### Connectivity & identity

```bash
payloadx ping --json
payloadx whoami --json
```

### Read

```bash
# Find documents (paginated)
payloadx find <collection> --json
payloadx find <collection> --where '{"field":{"equals":"value"}}' --limit 10 --page 1 --json
payloadx find <collection> --sort "-createdAt" --depth 2 --locale en --draft --json

# Get single document
payloadx get <collection> <id> --json
payloadx get <collection> <id> --depth 2 --json
```

### Create

```bash
# Dry-run (default — no write)
payloadx create <collection> --data '{"title":"New post"}' --json

# Apply
payloadx create <collection> --data '{"title":"New post"}' --apply --json

# With file upload (media/upload collections)
payloadx create media --file ./image.png --data '{"alt":"Hero"}' --apply --json
payloadx create media --file "https://example.com/photo.jpg" --data '{"alt":"Photo"}' --apply --json
```

`--data` accepts a JSON string or `@file.json` reference. `--data` is optional when `--file` is provided.

### Update

```bash
# Dry-run — shows diff of changed fields
payloadx update <collection> <id> --data '{"title":"Updated"}' --json

# Apply
payloadx update <collection> <id> --data '{"title":"Updated"}' --apply --json

# Replace file on upload collection
payloadx update media <id> --file ./new-image.png --apply --json
```

### Delete

```bash
# Dry-run — confirms existence
payloadx delete <collection> <id> --json

# Apply
payloadx delete <collection> <id> --apply --json
```

### Bulk update

```bash
payloadx bulk-update <collection> --where '{"status":{"equals":"draft"}}' --set '{"status":"published"}' --apply --json
```

Safety cap: defaults to `--limit 200`.

### Upsert

```bash
payloadx upsert <collection> --where '{"slug":{"equals":"about"}}' --data '{"title":"About Us"}' --apply --json
```

Finds by `--where`; creates if no match, updates if found.

### Raw request

```bash
payloadx request --method GET --path "/custom-endpoint" --json
payloadx request --method POST --path "/custom-endpoint" --data '{"key":"value"}' --apply --json
```

### Run script

```bash
payloadx run ./scripts/migrate.ts --apply --json
```

## Where query syntax

Follows [Payload query language](https://payloadcms.com/docs/queries/overview):

```json
{"field": {"operator": "value"}}
```

Operators: `equals`, `not_equals`, `greater_than`, `less_than`, `like`, `contains`, `in`, `not_in`, `exists`, `near`.

Logical: `{"or": [...]}`, `{"and": [...]}`.

Load from file: `--where @query.json`.

## Production safety

When targeting production (profile `environment: "prod"` or URL without dev/staging/localhost markers), writes require both `--apply` and `--allow-prod`:

```bash
payloadx update posts 123 --data '{"featured":true}' --apply --allow-prod --json
```

## Typical agent workflow

```bash
# 1. Verify connectivity
payloadx ping --json

# 2. Discover content
payloadx find posts --limit 5 --json

# 3. Read specific document
payloadx get posts 42 --json

# 4. Preview change (dry-run)
payloadx update posts 42 --data '{"title":"New Title"}' --json

# 5. Apply change
payloadx update posts 42 --data '{"title":"New Title"}' --apply --allow-prod --json

# 6. Upload image
payloadx create media --file ./hero.png --data '{"alt":"Hero"}' --apply --allow-prod --json

# 7. Delete
payloadx delete posts 99 --apply --allow-prod --json
```

## Response shapes

For detailed response shapes, see [reference.md](reference.md).
