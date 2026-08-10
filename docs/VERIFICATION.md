# VERIFICATION

Local verification checklist:

```bash
cp .env.example .env
make up
make migrate
npm run db:reset
pnpm load:companies -- --dir ./data
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
pnpm verify
pnpm dev
```

Local UI URL:

```text
http://127.0.0.1:3011/companies
```

Checked manually on the real `data_pack.zip`:

- `/companies` returns 200 and renders the Russian UI.
- `/companies?lang=en` returns 200 and switches the visible copy to English.
- `/companies?lang=zh` returns 200 and switches the visible copy to Chinese.
- Dashboard metrics, city/category filters, search, sort, outreach score, and data completeness render from PostgreSQL.
- JSON load result: 1000 rows read, 994 unique companies inserted, 0 rejected.
- `review.csv` result: 207 rows read, 0 inserted as reviews, 207 quarantined as `REVIEW_NOT_A_REVIEW_EXPORT`.

The real data flow used:

```bash
Expand-Archive data_pack.zip -DestinationPath data -Force
npm run db:reset
npm run migrations
pnpm load:companies -- --dir ./data
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
```
