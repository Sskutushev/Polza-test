# Polza Agency Technical Task

## Quickstart

```bash
cp .env.example .env
make up && make migrate && make load
pnpm dev
```

Open http://localhost:3000/companies.

## What Is Implemented

- PostgreSQL schema in `packages/db/migrations/001_init.sql`
- Required SQL queries in `packages/db/queries.sql`
- Shared normalization and validation in `packages/shared`
- JSON company loader and `review.csv` loader/profiler in `packages/ingest`
- Next.js `/companies` page and `/api/companies`
- Unit/integration/API/component/perf/E2E test placeholders and docs

## Data

Put the unpacked `data_pack.zip` files into `data/`. JSON files are loaded by:

```bash
pnpm load:companies -- --dir ./data
```

Reviews are profiled and loaded by:

```bash
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
```

## Verification

```bash
pnpm verify
```

See `docs/TESTING.md`, `docs/DATA_REPORT.md`, `docs/ANOMALIES.md`, and `docs/VERIFICATION.md`.
