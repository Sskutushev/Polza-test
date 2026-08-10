import pg from "pg";

const { Pool } = pg;

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

export function createPool(): pg.Pool {
  return new Pool({ connectionString: databaseUrl() });
}
