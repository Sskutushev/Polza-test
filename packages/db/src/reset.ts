import { createPool } from "./index.js";

const pool = createPool();

try {
  await pool.query(`
    TRUNCATE TABLE
      review_quarantine,
      review,
      rejected_row,
      ingest_run,
      company,
      category,
      city
    RESTART IDENTITY CASCADE
  `);
  console.log("database reset complete");
} finally {
  await pool.end();
}
