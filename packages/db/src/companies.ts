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
  outreachScore: number;
  dataCompleteness: number;
};

export type CompanyFacet = {
  slug: string;
  name: string;
  count: number;
};

export type CompanyStats = {
  total: number;
  withWebsite: number;
  withPhone: number;
  avgRating: number | null;
  totalReviews: number;
  topCategory: string | null;
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
        (
          CASE WHEN company.website_host IS NOT NULL THEN 25 ELSE 0 END +
          CASE WHEN company.phone_e164 IS NOT NULL THEN 20 ELSE 0 END +
          CASE WHEN company.rating >= 4.5 THEN 25 WHEN company.rating >= 4 THEN 18 WHEN company.rating >= 3.5 THEN 10 ELSE 0 END +
          CASE WHEN company.reviews_count >= 50 THEN 30 WHEN company.reviews_count >= 10 THEN 18 WHEN company.reviews_count > 0 THEN 8 ELSE 0 END
        ) AS outreach_score,
        (
          CASE WHEN company.name IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.category_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.city_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.address IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.rating IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.reviews_count IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.website_host IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN company.phone_e164 IS NOT NULL THEN 1 ELSE 0 END
        ) AS completeness,
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
        outreachScore: Number(row.outreach_score ?? 0),
        dataCompleteness: Math.round((Number(row.completeness ?? 0) / 8) * 100),
      })),
    };
  } finally {
    await pool.end();
  }
}

export async function getCompanyFacets(): Promise<{
  cities: CompanyFacet[];
  categories: CompanyFacet[];
}> {
  const pool = createPool();
  try {
    const [cities, categories] = await Promise.all([
      pool.query(`
        SELECT city.slug, city.name, count(company.id)::int AS count
        FROM city
        JOIN company ON company.city_id = city.id
        GROUP BY city.slug, city.name
        ORDER BY count DESC, city.name ASC
      `),
      pool.query(`
        SELECT category.slug, category.name, count(company.id)::int AS count
        FROM category
        JOIN company ON company.category_id = category.id
        GROUP BY category.slug, category.name
        ORDER BY count DESC, category.name ASC
      `),
    ]);
    return {
      cities: cities.rows.map(toFacet),
      categories: categories.rows.map(toFacet),
    };
  } finally {
    await pool.end();
  }
}

export async function getCompanyStats(): Promise<CompanyStats> {
  const pool = createPool();
  try {
    const result = await pool.query(`
      WITH base AS (
        SELECT
          count(company.id)::int AS total,
          count(company.id) FILTER (WHERE company.website_host IS NOT NULL)::int AS with_website,
          count(company.id) FILTER (WHERE company.phone_e164 IS NOT NULL)::int AS with_phone,
          round(avg(company.rating)::numeric, 2) AS avg_rating,
          coalesce(sum(company.reviews_count), 0)::int AS total_reviews
        FROM company
      ),
      top_category AS (
        SELECT category.name
        FROM company
        JOIN category ON category.id = company.category_id
        GROUP BY category.name
        ORDER BY count(company.id) DESC, category.name ASC
        LIMIT 1
      )
      SELECT base.*, top_category.name AS top_category
      FROM base
      LEFT JOIN top_category ON true
    `);
    const row = result.rows[0] ?? {};
    return {
      total: Number(row.total ?? 0),
      withWebsite: Number(row.with_website ?? 0),
      withPhone: Number(row.with_phone ?? 0),
      avgRating: row.avg_rating == null ? null : Number(row.avg_rating),
      totalReviews: Number(row.total_reviews ?? 0),
      topCategory: row.top_category ?? null,
    };
  } finally {
    await pool.end();
  }
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function toFacet(row: Record<string, unknown>): CompanyFacet {
  return {
    slug: String(row.slug),
    name: String(row.name),
    count: Number(row.count ?? 0),
  };
}
