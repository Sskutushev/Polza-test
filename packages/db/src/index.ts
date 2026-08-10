import pg from "pg";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

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
  const envPath = findEnvPath();
  if (!envPath) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
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

function findEnvPath(): string | null {
  let current = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(current, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return null;
}
