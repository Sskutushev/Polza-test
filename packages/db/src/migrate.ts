import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPool } from "./index.js";

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(here, "..", "migrations", "001_init.sql");

const pool = createPool();
try {
  const sql = await readFile(migrationPath, "utf8");
  await pool.query(sql);
  console.log("migrations applied");
} finally {
  await pool.end();
}
