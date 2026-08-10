# Polza Agency Technical Task

## Quickstart

```bash
cp .env.example .env
make up && make migrate
Expand-Archive data_pack.zip -DestinationPath data -Force
npm run db:reset
pnpm load:companies -- --dir ./data
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
pnpm dev
```

Open http://localhost:3000/companies.

If port 3000 is busy, run:

```bash
npm run dev -- -p 3011
```

Open http://127.0.0.1:3011/companies.

## What Is Implemented

- PostgreSQL schema in `packages/db/migrations/001_init.sql`
- Required SQL queries in `packages/db/queries.sql`
- Shared normalization and validation in `packages/shared`
- JSON company loader and `review.csv` loader/profiler in `packages/ingest`
- Next.js `/companies` page and `/api/companies`
- RU/EN/ZH UI language switch through `?lang=ru|en|zh`
- Operator dashboard metrics, outreach score, data completeness indicators
- Demo seed for local visual verification without the real archive
- Unit/integration/API/component/perf/E2E test placeholders and docs

## Data

Put the unpacked `data_pack.zip` files into `data/`. JSON files are loaded by:

```bash
npm run db:reset
npm run migrations
pnpm load:companies -- --dir ./data
```

Reviews are profiled and loaded by:

```bash
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
```

For local UI review before receiving the archive:

```bash
npm run seed:demo
```

Current result from the provided archive:

- 1000 company rows read from JSON
- 994 unique companies inserted after deduplication
- 0 rejected company rows
- 756 companies with parsed websites
- 884 companies with normalized phones
- 207 `review.csv` rows quarantined because the file is company-shaped, not review-shaped
- 0 rows inserted into `review`

## Verification

```bash
pnpm verify
```

See `docs/TESTING.md`, `docs/DATA_REPORT.md`, `docs/ANOMALIES.md`, and `docs/VERIFICATION.md`.

## Codex Quality Chain

The required local chain is documented in `AGENTS.md`:

```bash
npm run eslint
npm run typecheck
npm run test
npm run migrations
npm run format
```
