up:
	docker compose up -d

down:
	docker compose down

migrate:
	pnpm migrate

load:
	pnpm load:companies -- --dir ./data

load-reviews:
	pnpm load:reviews -- --file ./data/review.csv

dev:
	pnpm dev

verify:
	pnpm verify
