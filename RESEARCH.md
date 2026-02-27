# PayloadX CLI — Research Notes

Research performed 2026-02-26 against Payload CMS v3.x documentation.

## REST API

**Source:** <https://payloadcms.com/docs/rest-api/overview>

- All routes mounted under `routes.api` (default `/api`).
- Collection routes: `/api/{collection-slug}`.
- Global routes: `/api/globals/{global-slug}`.
- Query parameters: `where`, `sort`, `page`, `limit`, `depth`, `locale`, `fallback-locale`, `select`, `populate`, `joins`.

### Collection CRUD Endpoints

| Operation      | Method   | Path                            |
| -------------- | -------- | ------------------------------- |
| Find           | `GET`    | `/api/{slug}`                   |
| Find By ID     | `GET`    | `/api/{slug}/{id}`              |
| Count          | `GET`    | `/api/{slug}/count`             |
| Create         | `POST`   | `/api/{slug}`                   |
| Update (bulk)  | `PATCH`  | `/api/{slug}`                   |
| Update By ID   | `PATCH`  | `/api/{slug}/{id}`              |
| Delete (bulk)  | `DELETE` | `/api/{slug}`                   |
| Delete By ID   | `DELETE` | `/api/{slug}/{id}`              |

### Auth Endpoints (on auth-enabled collections)

| Operation        | Method | Path                                  |
| ---------------- | ------ | ------------------------------------- |
| Login            | `POST` | `/api/{user-collection}/login`        |
| Logout           | `POST` | `/api/{user-collection}/logout`       |
| Current User     | `GET`  | `/api/{user-collection}/me`           |
| Refresh Token    | `POST` | `/api/{user-collection}/refresh-token`|
| Forgot Password  | `POST` | `/api/{user-collection}/forgot-password`|
| Reset Password   | `POST` | `/api/{user-collection}/reset-password`|

## Pagination Response Shape

**Source:** <https://payloadcms.com/docs/queries/pagination>

```json
{
  "docs": [ ... ],
  "totalDocs": 6,
  "limit": 10,
  "totalPages": 1,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": false,
  "prevPage": null,
  "nextPage": null
}
```

Default `limit` is `10`. Set `pagination: false` to disable pagination overhead.

## Query Language

**Source:** <https://payloadcms.com/docs/queries/overview>

Operators: `equals`, `not_equals`, `greater_than`, `greater_than_equal`, `less_than`, `less_than_equal`, `like`, `contains`, `in`, `not_in`, `all`, `exists`, `near`, `within`, `intersects`.

AND/OR logic supported via `{ or: [...] }` and `{ and: [...] }` nesting.

REST API uses query-string encoding: `?where[color][equals]=mint`. The `qs-esm` package is recommended for serialization.

## Payload SDK (`@payloadcms/sdk`)

**Source:** <https://payloadcms.com/docs/rest-api/overview> (SDK section)

- Package: `@payloadcms/sdk` (latest `3.77.0` as of 2026-02-26; SDK is in beta).
- Constructor: `new PayloadSDK({ baseURL: 'https://example.com/api' })`.
- Supports custom `fetch` and `baseInit` (shared `RequestInit` properties, including headers).

### Operations

| Method         | Signature                                                          |
| -------------- | ------------------------------------------------------------------ |
| `find`         | `sdk.find({ collection, where?, limit?, page?, depth?, sort?, locale?, draft? }, requestInit?)` |
| `findByID`     | `sdk.findByID({ id, collection, depth?, locale?, draft? }, requestInit?)`                      |
| `create`       | `sdk.create({ collection, data, file? }, requestInit?)`                                        |
| `update`       | `sdk.update({ collection, id?, where?, data }, requestInit?)` — id for single, where for bulk  |
| `delete`       | `sdk.delete({ collection, id?, where? }, requestInit?)` — id for single, where for bulk        |
| `count`        | `sdk.count({ collection, where? }, requestInit?)`                                              |
| `me`           | `sdk.me({ collection }, requestInit?)`                                                         |
| `login`        | `sdk.login({ collection, data: { email, password } }, requestInit?)`                           |
| `request`      | `sdk.request({ method, path, json? }, requestInit?)` — for custom endpoints                    |

Every operation accepts an optional second `RequestInit` parameter for additional headers.

## Authentication

### API Keys

**Source:** <https://payloadcms.com/docs/authentication/api-keys>

Exact `Authorization` header format (case-sensitive):

```
Authorization: <collectionSlug> API-Key <apiKey>
```

Example: `Authorization: users API-Key abc123def456`

The collection slug is the slug of the auth-enabled collection with `useAPIKey: true`.

### JWT

**Source:** <https://payloadcms.com/docs/authentication/jwt>

Exact `Authorization` header format:

```
Authorization: JWT <token>
```

Example: `Authorization: JWT eyJhbGciOiJIUzI1NiIs...`

Token is obtained from login/refresh operations. External validation requires hashing `PAYLOAD_SECRET` with SHA-256.

## Local API — Access Control

**Source:** <https://payloadcms.com/docs/local-api/overview>, <https://payloadcms.com/docs/local-api/access-control>

- `overrideAccess` defaults to `true` in all Local API operations (access control is **skipped** by default).
- To enforce access control, explicitly pass `overrideAccess: false` and a `user` object.
- This is relevant for server-side scripts; not used in v1 CLI (which operates via REST/SDK), but documented here for reference.
