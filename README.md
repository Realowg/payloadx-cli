# payloadx-cli

Non-interactive CLI for Payload CMS. Designed for automation bots (OpenClaw agents) and developer scripting.

**Package name:** `payloadx-cli`
**Binary:** `payloadx`

## Install

```bash
npm i -g payloadx-cli
# or
pnpm i -g payloadx-cli
```

## Quick Start

```bash
# Set credentials
export PAYLOADX_API_KEY=your-api-key
export PAYLOADX_BASE_URL=https://your-site.com/api

# Initialize config
payloadx init

# Test connectivity
payloadx ping --json

# Find documents
payloadx find posts --where '{"title":{"like":"foo"}}' --json

# Get a single document
payloadx get posts 6789abcd --json

# Update (dry-run by default)
payloadx update posts 6789abcd --data '{"status":"published"}' --json

# Update (apply)
payloadx update posts 6789abcd --data '{"status":"published"}' --apply --json
```

## Authentication

Credentials are read from environment variables (recommended) or CLI flags.

### API Key

```bash
export PAYLOADX_API_KEY=your-api-key
export PAYLOADX_AUTH_COLLECTION=users  # defaults to "users"
```

Header format (per Payload docs): `Authorization: users API-Key <key>`

### JWT

```bash
export PAYLOADX_JWT=your-jwt-token
```

Header format: `Authorization: JWT <token>`

API key takes priority when both are set.

## Configuration

Create `.payloadxrc.json` in your project root (or `~/.payloadxrc.json` for global defaults):

```json
{
  "defaults": { "profile": "staging" },
  "profiles": {
    "staging": {
      "baseURL": "https://staging.example.com/api",
      "authCollection": "users",
      "environment": "staging"
    },
    "prod": {
      "baseURL": "https://example.com/api",
      "authCollection": "users",
      "environment": "prod"
    }
  }
}
```

**Precedence:** CLI flags > env vars > project `.payloadxrc.json` > home `~/.payloadxrc.json`

### Environment Variables

| Variable | Description |
|---|---|
| `PAYLOADX_PROFILE` | Profile name to use |
| `PAYLOADX_BASE_URL` | Payload API base URL |
| `PAYLOADX_AUTH_COLLECTION` | Auth collection slug (default: `users`) |
| `PAYLOADX_API_KEY` | API key |
| `PAYLOADX_JWT` | JWT token |
| `PAYLOADX_ALLOW_PROD` | Set to `1` to allow writes to production |

## Global Flags

| Flag | Description |
|---|---|
| `--profile <name>` | Config profile name |
| `--base-url <url>` | Payload API base URL |
| `--auth-collection <slug>` | Auth collection slug |
| `--api-key <key>` | API key |
| `--jwt <token>` | JWT token |
| `--json` | Output JSON to stdout |
| `--log-level <level>` | `silent\|error\|warn\|info\|debug` |
| `--out-dir <path>` | Journal output dir (default: `.payloadx`) |
| `--allow-prod` | Allow writes to production |
| `--apply` | Execute writes (default: dry-run) |
| `--timeout <ms>` | Request timeout (default: 30000) |

## Commands

### `payloadx init`
Create a `.payloadxrc.json` template in the current directory.

### `payloadx ping`
Verify connectivity to the Payload API.

### `payloadx whoami`
Show the current authenticated user identity.

### `payloadx find <collection>`
Find documents. Supports `--where`, `--limit`, `--page`, `--depth`, `--sort`, `--locale`, `--draft`.

### `payloadx get <collection> <id>`
Get a single document by ID. Supports `--depth`, `--locale`, `--draft`.

### `payloadx create <collection>`
Create a document. Requires `--data` and/or `--file`. Dry-run by default. Use `--file` for upload collections (e.g. `media`).

### `payloadx update <collection> <id>`
Update a document by ID. Requires `--data` and/or `--file`. Dry-run shows a diff of changed fields. Use `--file` to replace the file on upload collections.

### `payloadx delete <collection> <id>`
Delete a document by ID. Dry-run confirms existence.

### `payloadx bulk-update <collection>`
Update multiple documents. Requires `--where` and `--set`. Safety cap: `--limit 200`.

### `payloadx upsert <collection>`
Create or update based on `--where` match. Requires `--where` and `--data`.

### `payloadx request`
Raw HTTP request. Requires `--method` and `--path`. Optional `--data`.

### `payloadx run <script>`
Run a migration script. Scripts are discovered from explicit paths or `./payloadx/scripts/`.

Script API:
```typescript
export default async function main(ctx: {
  sdk: PayloadSDK
  log: Logger
  args: string[]
  profile: string | undefined
  dryRun: boolean
  apply: boolean
  journal: JournalWriter
}): Promise<{ summary: any }>
```

## Safety

- **Dry-run by default:** All write commands require `--apply` to execute.
- **Production guard:** If the target is detected as production (environment `prod` or URL without dev/staging markers), `--allow-prod` or `PAYLOADX_ALLOW_PROD=1` is also required.
- **Journaling:** Every write attempt creates a JSONL journal at `.payloadx/runs/`.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 2 | Validation/config error |
| 3 | Auth error (401/403) |
| 4 | Network error |
| 5 | Server error (5xx) |
| 6 | Partial failure (bulk ops) |

## File Uploads

Upload collections (like `media`) support the `--file` flag on `create` and `update`:

```bash
# Upload a local image
payloadx create media --file ./hero.png --data '{"alt":"Hero image"}' --apply --allow-prod --json

# Upload from a URL (SDK fetches it)
payloadx create media --file "https://example.com/photo.jpg" --data '{"alt":"Photo"}' --apply --allow-prod --json

# Replace an existing media file
payloadx update media 6 --file ./new-hero.png --apply --allow-prod --json

# Update metadata only (no file change)
payloadx update media 6 --data '{"alt":"Updated alt text"}' --apply --allow-prod --json
```

Supported file types: png, jpg/jpeg, gif, webp, svg, avif, pdf, mp4, webm, mp3, and more.

## Where Queries

Where queries follow the [Payload query language](https://payloadcms.com/docs/queries/overview):

```bash
# Exact match
payloadx find posts --where '{"status":{"equals":"published"}}' --json

# AND/OR
payloadx find posts --where '{"or":[{"status":{"equals":"draft"}},{"featured":{"equals":true}}]}' --json

# From file
payloadx find posts --where @query.json --json
```

## OpenClaw Bot Usage

Bots should always:
1. Use `--json` for machine-readable output
2. Set secrets via env vars (never CLI flags in logs)
3. Parse stdout as JSON, check `exitCode` on non-zero exit

```bash
export PAYLOADX_API_KEY=secret
export PAYLOADX_BASE_URL=https://api.example.com/api

payloadx find posts --where '{"title":{"like":"foo"}}' --limit 5 --json
payloadx update posts abc123 --data '{"status":"published"}' --apply --allow-prod --json
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
