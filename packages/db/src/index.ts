import pg from "pg";
import { existsSync, readFileSync } from "node:fs";

const { Pool } = pg;

export function databaseUrl(): string {
  loadLocalEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return url;
}

export function createPool(): pg.Pool {
  return new Pool({ connectionString: databaseUrl() });
}

let envLoaded = false;

function loadLocalEnv(): void {
  if (envLoaded || process.env.DATABASE_URL) return;
  envLoaded = true;
  if (!existsSync(".env")) return;
  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ??= value;
  }
}
