# VERIFICATION

Local verification checklist:

```bash
cp .env.example .env
make up
make migrate
make load
pnpm verify
pnpm dev
```

Manual notes should be written after running the project with the real data pack.
