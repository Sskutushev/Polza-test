# Codex Rules

## Work Style

Act like a senior engineer. Read the existing code before changing anything. Keep changes small, decomposed, reusable, and easy to review. Do not build one large file when the logic naturally belongs in separate modules.

Prefer pure functions for business logic. Put I/O at the edges. Shared validation, normalization, parsing, and formatting must live in reusable packages instead of being copied into pages, route handlers, or scripts.

Every important behavior needs a test at the lowest level that still gives confidence. Do not add E2E tests for logic that can be proven with unit or integration tests.

## Required Quality Chain

After meaningful code changes, run this chain in order:

```bash
npm run eslint
npm run typecheck
npm run test
npm run migrations
npm run format
```

`npm run format` is always last because it may rewrite files to match project standards.

If a local database is not available, say that `npm run migrations` could not be executed and explain the exact blocker. Do not pretend it passed.

## Test Strategy

Unit tests are required for pure logic:

- normalizers
- validators
- dedup keys
- parsers
- scoring and ranking logic
- edge cases and bugfix reproductions

Integration tests are required for behavior that depends on real boundaries:

- PostgreSQL schema and migrations
- SQL queries
- loaders and ETL pipelines
- quarantine and rejected row logic
- idempotent imports
- external storage or vector search adapters when mocked behavior would hide real failures

API tests are required for route contracts:

- input validation
- error bodies
- filters and pagination
- auth behavior when present
- SQL injection and unsafe query parameters

Performance tests are required where scale changes the behavior:

- ingest throughput
- memory use for large files
- query plans and indexes
- hot API routes

E2E tests are only for the main product logic at the end of the chain:

- critical user flows
- browser state in the URL
- multi-step scenarios
- flows where client, API, database, and UI must work together

## Migration Rules

Database changes must be explicit and reviewable. Write migrations as source of truth, keep schema snapshots aligned, and make migration scripts idempotent when possible.

Before finishing DB work, run:

```bash
npm run migrations
```

If migrations fail, fix the table definitions, indexes, constraints, or migration runner. Do not bypass failing migrations by changing tests only.

## Decomposition Rules

Keep domain logic out of Next pages and route handlers. UI components should render state and call small helpers. Route handlers should validate input, call a repository or service, and return a typed response.

Avoid duplicated rules. If email validation, URL normalization, rating parsing, deduplication, or issue codes are needed in two places, move them to a shared module.

Do not use `any` or `@ts-ignore` as a shortcut. If a source format is dirty, model it with `unknown`, validate it, and convert it into a typed domain object.

## Final Checklist

Before the final answer:

- code is decomposed and reusable
- tests cover unit, integration, API, performance where relevant, and E2E for core flows
- `npm run eslint` passes
- `npm run typecheck` passes
- `npm run test` passes
- `npm run migrations` was run or the blocker is stated
- `npm run format` was run last
- final `git diff` was reviewed
