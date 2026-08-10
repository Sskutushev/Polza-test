import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parse } from "csv-parse/sync";
import { createPool } from "@polza/db";
import { cleanText, mapCompany, normalizeEmail, normalizeRating, slugify, type Issue } from "@polza/shared";

type JsonRecord = Record<string, unknown>;

const command = process.argv[2];
const args = process.argv.slice(3);

if (command === "companies") await loadCompanies(readArg("--dir", "./data"));
else if (command === "reviews") await loadReviews(readArg("--file", "./data/review.csv"));
else if (command === "profile-csv") await profileCsv(readArg("--file", "./data/review.csv"));
else {
  console.error("Usage: companies --dir ./data | reviews --file ./data/review.csv | profile-csv --file ./data/review.csv");
  process.exit(1);
}

function readArg(name: string, fallback: string): string {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

async function loadCompanies(dir: string): Promise<void> {
  const pool = createPool();
  const run = await pool.query("INSERT INTO ingest_run(source, status) VALUES($1, 'running') RETURNING id", ["companies"]);
  const runId = Number(run.rows[0].id);
  let read = 0;
  let inserted = 0;
  let rejected = 0;

  try {
    const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
    for (const file of files) {
      const payload = JSON.parse(await readFile(join(dir, file), "utf8")) as unknown;
      const rows = unwrapJsonRows(payload);
      for (let index = 0; index < rows.length; index += 1) {
        read += 1;
        const { company, issues } = mapCompany(rows[index] ?? {});
        const fatal = issues.find((issue) => issue.severity === "error");
        if (!company || fatal) {
          rejected += 1;
          await insertRejected(pool, runId, file, index, rows[index] ?? {}, fatal ?? issues[0]);
          continue;
        }
        const categoryId = company.category ? await upsertLookup(pool, "category", company.category) : null;
        const cityId = company.city ? await upsertLookup(pool, "city", company.city.name, company.city.slug) : null;
        const result = await pool.query(
          `INSERT INTO company(source_id, name, name_norm, category_id, city_id, address, rating, reviews_count,
             website, website_host, phone_e164, phone_raw, dedup_key, source_file, source_index, raw)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           ON CONFLICT (dedup_key) DO UPDATE SET
             last_seen_at = now(),
             reviews_count = GREATEST(COALESCE(company.reviews_count, 0), COALESCE(EXCLUDED.reviews_count, 0)),
             website = COALESCE(company.website, EXCLUDED.website),
             website_host = COALESCE(company.website_host, EXCLUDED.website_host),
             phone_e164 = COALESCE(company.phone_e164, EXCLUDED.phone_e164)
           RETURNING (xmax = 0) AS inserted`,
          [
            company.sourceId,
            company.name,
            company.nameNorm,
            categoryId,
            cityId,
            company.address,
            company.rating,
            company.reviewsCount,
            company.website,
            company.websiteHost,
            company.phoneE164,
            company.phoneRaw,
            company.dedupKey,
            file,
            index,
            company.raw
          ]
        );
        if (result.rows[0]?.inserted) inserted += 1;
      }
    }
    await pool.query(
      "UPDATE ingest_run SET status='success', finished_at=now(), rows_read=$1, rows_inserted=$2, rows_rejected=$3 WHERE id=$4",
      [read, inserted, rejected, runId]
    );
    console.log(`companies read=${read} inserted=${inserted} rejected=${rejected}`);
  } catch (error) {
    await pool.query("UPDATE ingest_run SET status='failed', finished_at=now(), rows_read=$1, rows_inserted=$2, rows_rejected=$3 WHERE id=$4", [read, inserted, rejected, runId]);
    throw error;
  } finally {
    await pool.end();
  }
}

function unwrapJsonRows(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload)) {
    for (const key of ["data", "items", "companies", "results"]) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
  }
  return [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function upsertLookup(pool: ReturnType<typeof createPool>, table: "category" | "city", name: string, forcedSlug?: string): Promise<number> {
  const slug = forcedSlug ?? slugify(name);
  const result = await pool.query(`INSERT INTO ${table}(slug, name) VALUES($1, $2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`, [slug, name]);
  return Number(result.rows[0].id);
}

async function insertRejected(pool: ReturnType<typeof createPool>, runId: number, file: string, index: number, payload: unknown, issue?: Issue): Promise<void> {
  await pool.query(
    "INSERT INTO rejected_row(run_id, source_file, source_index, payload, code, message) VALUES($1,$2,$3,$4,$5,$6)",
    [runId, file, index, payload, issue?.code ?? "FIELD_UNKNOWN", issue?.message ?? "Unknown parsing issue"]
  );
}

async function loadReviews(file: string): Promise<void> {
  const rows = parse(await readFile(file, "utf8"), { columns: true, skip_empty_lines: true }) as JsonRecord[];
  const pool = createPool();
  const run = await pool.query("INSERT INTO ingest_run(source, status, rows_read) VALUES($1, 'running', $2) RETURNING id", ["reviews", rows.length]);
  const runId = Number(run.rows[0].id);
  let inserted = 0;
  let rejected = 0;
  try {
    for (const row of rows) {
      const companyName = cleanText(row.company ?? row.company_name ?? row.name);
      const city = cleanText(row.city);
      const nameNorm = companyName?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const company = await pool.query(
        `SELECT company.id FROM company LEFT JOIN city ON city.id = company.city_id
         WHERE company.name_norm = $1 AND ($2::text IS NULL OR city.slug = $2) LIMIT 1`,
        [nameNorm, city ? slugify(city) : null]
      );
      if (!company.rows[0]) {
        rejected += 1;
        await pool.query("INSERT INTO review_quarantine(run_id, payload, code, message) VALUES($1,$2,$3,$4)", [runId, row, "ORPHAN_COMPANY_REF", "Cannot link review to company"]);
        continue;
      }
      const email = normalizeEmail(row.email);
      const emailCodes = email.value?.codes ?? email.issues.map((issue) => issue.code);
      if (email.value?.status === "invalid" || email.issues.length > 0) {
        rejected += 1;
        await pool.query("INSERT INTO review_quarantine(run_id, payload, code, message) VALUES($1,$2,$3,$4)", [runId, row, emailCodes[0] ?? "EMAIL_SYNTAX_INVALID", "Email failed validation"]);
        continue;
      }
      const rating = normalizeRating(row.rating ?? row.stars);
      await pool.query(
        `INSERT INTO review(external_id, company_id, author, email, email_status, rating, body, review_date, raw)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (external_id) DO UPDATE SET body=EXCLUDED.body, rating=EXCLUDED.rating`,
        [
          cleanText(row.id ?? row.external_id) ?? `${company.rows[0].id}:${cleanText(row.author) ?? ""}:${cleanText(row.text ?? row.body) ?? ""}`,
          company.rows[0].id,
          cleanText(row.author),
          email.value?.normalized ?? null,
          email.value?.status ?? null,
          rating.value,
          cleanText(row.text ?? row.body ?? row.review),
          parseDate(row.date ?? row.created_at),
          row
        ]
      );
      inserted += 1;
    }
    await pool.query("UPDATE ingest_run SET status='success', finished_at=now(), rows_inserted=$1, rows_rejected=$2 WHERE id=$3", [inserted, rejected, runId]);
    console.log(`reviews read=${rows.length} inserted=${inserted} rejected=${rejected}`);
  } finally {
    await pool.end();
  }
}

async function profileCsv(file: string): Promise<void> {
  const text = await readFile(file, "utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true }) as JsonRecord[];
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    "# DATA_REPORT",
    "",
    `- File: \`${basename(file)}\``,
    `- Rows: ${rows.length}`,
    `- Columns: ${headers.length}`,
    "",
    "## Columns",
    "",
    "| column | empty | unique | examples |",
    "|---|---:|---:|---|"
  ];
  for (const header of headers) {
    const values = rows.map((row) => cleanText(row[header])).filter((value): value is string => Boolean(value));
    lines.push(`| ${header} | ${rows.length - values.length} | ${new Set(values).size} | ${values.slice(0, 3).join(", ")} |`);
  }
  await writeFile("docs/DATA_REPORT.md", `${lines.join("\n")}\n`);
  console.log("docs/DATA_REPORT.md written");
}

function parseDate(raw: unknown): Date | null {
  const value = cleanText(raw);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
