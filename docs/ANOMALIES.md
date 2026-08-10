# ANOMALIES

## A-01. `review.csv` is not a review export

- What is wrong: the file has company columns: `id`, `name`, `category`, `city`, `address`, `rating`, `reviews_count`, `site`, `phone`.
- Evidence: 0 columns for review text, 0 columns for author, 0 columns for email, 0 date columns.
- Scale: 207 of 207 rows.
- Impact: loading this as reviews would create fake review records and hide the real data issue.
- Decision: 207 rows were written to `review_quarantine` with code `REVIEW_NOT_A_REVIEW_EXPORT`; 0 rows were inserted into `review`.

## A-02. `review.csv` mostly belongs to another id range

- What is wrong: the main JSON export covers `c_000001` through `c_001000`, but `review.csv` contains many ids after that range.
- Evidence: 199 of 207 CSV ids are greater than `c_001000`; only 8 ids are in the main export range.
- Impact: this looks like a different page/batch/source, not a fresh export for the same loaded base.
- Decision: do not merge by id; keep rows quarantined.

## A-03. Mojibake in source text

- What is wrong: source values contain UTF-8 decoded as Windows-1251, for example `РћРћРћ В«РџСЂР°Р№Рј РњРµРґРёР°В»`.
- Evidence: 144 of 207 rows in `review.csv` contain mojibake patterns before normalization. JSON pages also contain the same issue.
- Impact: search, deduplication, city/category grouping, and manual review are unreliable if this is stored raw.
- Decision: shared `cleanText` repairs mojibake before normalization. Loaded company samples are readable, for example `ООО «Прайм Медиа»`.

## A-04. No email data despite evaluation criterion

- What is wrong: `review.csv` has no email column.
- Evidence: headers contain only `id,name,category,city,address,rating,reviews_count,site,phone`.
- Impact: the high-weight criterion "real, valid email" cannot be satisfied from the attached data because email values are absent.
- Decision: email validator is implemented in `packages/shared`, but this dataset cannot produce valid email metrics.

## A-05. Bad rating values in `review.csv`

- What is wrong: 4 rating values are not valid for the 0..5 scale.
- Evidence: examples include `N/A`, `4,5`, `-3`, `7.2`.
- Impact: blindly loading the file would corrupt rating aggregates.
- Decision: quarantined together with the malformed export.

## A-06. Duplicate and empty identifiers in `review.csv`

- What is wrong: 2 rows have empty ids and 3 ids are duplicated.
- Evidence: duplicated ids include `c_001049`, `c_001050`, `c_001075`.
- Impact: idempotent loading by external id would be unsafe.
- Decision: quarantined together with the malformed export.

## Final Conclusion

The JSON company export is usable after mojibake repair and deduplication: 1000 rows read, 994 unique companies inserted, 0 rejected. `review.csv` is not a fresh review export for the same base. It is company-shaped, has no review/email fields, mostly uses ids outside the loaded range, and contains rating/id quality issues. I intentionally quarantine all 207 CSV rows instead of forcing them into the review table.
