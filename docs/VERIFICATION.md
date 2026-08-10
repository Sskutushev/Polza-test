# VERIFICATION

Local verification checklist:

```bash
cp .env.example .env
make up
make migrate
npm run seed:demo
pnpm verify
pnpm dev
```

Local UI URL:

```text
http://127.0.0.1:3011/companies
```

Checked manually on the demo seed:

- `/companies` returns 200 and renders the Russian UI.
- `/companies?lang=en` returns 200 and switches the visible copy to English.
- `/companies?lang=zh` returns 200 and switches the visible copy to Chinese.
- Dashboard metrics, city/category filters, search, sort, outreach score, and data completeness render from PostgreSQL.

When the real `data_pack.zip` is available, replace the demo seed with:

```bash
pnpm load:companies -- --dir ./data
pnpm profile:csv -- --file ./data/review.csv
pnpm load:reviews -- --file ./data/review.csv
```
