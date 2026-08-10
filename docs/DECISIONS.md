# DECISIONS

- SQL schema is the source of truth; the app reads through a small typed repository.
- Deduplication is enforced by `company.dedup_key UNIQUE`, not only by TypeScript code.
- Bad source rows are quarantined in `rejected_row` or `review_quarantine`.
- Email validation returns reason codes so `ANOMALIES.md` can be backed by counts.
