# TESTING

The rule is to test behavior at the lowest level that still gives confidence.

Unit tests cover normalization, validators, dedup keys, and email reason codes. Integration tests cover real PostgreSQL schema, idempotent loading, SQL aggregates, and quarantine tables. API tests cover `/api/companies` validation and filtering. E2E is reserved for critical browser flows: search, combined filters, pagination, and deep links.
