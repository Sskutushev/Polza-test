import { z } from "zod";
import { createPool } from "./index.js";

export const companyQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  city: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default(""),
  sort: z.enum(["name", "rating", "reviews"]).optional().default("name"),
  dir: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type CompanyQuery = z.infer<typeof companyQuerySchema>;

export type CompanyRow = {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  rating: number | null;
  reviewsCount: number | null;
  websiteHost: string | null;
  website: string | null;
  phoneE164: string | null;
};

const sortColumns = {
  name: "company.name_norm",
  rating: "company.rating",
  reviews: "company.reviews_count",
} as const;

export async function findCompanies(
  input: Partial<CompanyQuery>,
): Promise<{ rows: CompanyRow[]; total: number }> {
  const params = companyQuerySchema.parse(input);
  const pool = createPool();
  const values: unknown[] = [];
  const where: string[] = [];

  if (params.q) {
    values.push(`%${escapeLike(params.q.toLowerCase())}%`);
    where.push(`company.name_norm ILIKE $${values.length} ESCAPE '\\'`);
  }
  if (params.city) {
    values.push(params.city);
    where.push(`city.slug = $${values.length}`);
  }
  if (params.category) {
    values.push(params.category);
    where.push(`category.slug = $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderColumn = sortColumns[params.sort];
  const orderDir = params.dir.toUpperCase();
  values.push(params.limit, (params.page - 1) * params.limit);

  try {
    const sql = `
      SELECT
        company.id,
        company.name,
        category.name AS category,
        city.name AS city,
        company.rating,
        company.reviews_count,
        company.website_host,
        company.website,
        company.phone_e164,
        count(*) OVER() AS total
      FROM company
      LEFT JOIN category ON category.id = company.category_id
      LEFT JOIN city ON city.id = company.city_id
      ${whereSql}
      ORDER BY ${orderColumn} ${orderDir} NULLS LAST, company.id ASC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;
    const result = await pool.query(sql, values);
    const total = Number(result.rows[0]?.total ?? 0);
    return {
      total,
      rows: result.rows.map((row) => ({
        id: Number(row.id),
        name: String(row.name),
        category: row.category,
        city: row.city,
        rating: row.rating == null ? null : Number(row.rating),
        reviewsCount:
          row.reviews_count == null ? null : Number(row.reviews_count),
        websiteHost: row.website_host,
        website: row.website,
        phoneE164: row.phone_e164,
      })),
    };
  } finally {
    await pool.end();
  }
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
