# ADR 0002: Company Merge Policy

Companies are merged by `dedup_key`.

On conflict, the loader keeps existing non-empty fields, fills missing website and phone fields from the new row, keeps the greatest `reviews_count`, and updates `last_seen_at`. This makes repeated loads idempotent and avoids replacing useful values with empty source data.
