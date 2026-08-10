import { createPool } from "./index.js";

const companies = [
  {
    name: "Northwind Outreach Lab",
    nameNorm: "northwind outreach lab",
    category: "B2B SaaS",
    city: "Москва",
    citySlug: "москва",
    address: "Тверская 7",
    rating: 4.8,
    reviews: 86,
    website: "https://northwind.example.com/",
    host: "northwind.example.com",
    phone: "+74951234567",
  },
  {
    name: "Dragon Bridge Analytics",
    nameNorm: "dragon bridge analytics",
    category: "Data enrichment",
    city: "上海",
    citySlug: "上海",
    address: "Pudong 18",
    rating: 4.6,
    reviews: 42,
    website: "https://dragonbridge.example.cn/",
    host: "dragonbridge.example.cn",
    phone: "+862112345678",
  },
  {
    name: "Signal Forge Studio",
    nameNorm: "signal forge studio",
    category: "Lead generation",
    city: "London",
    citySlug: "london",
    address: "Baker Street 221",
    rating: 4.3,
    reviews: 31,
    website: "https://signalforge.example/",
    host: "signalforge.example",
    phone: null,
  },
  {
    name: "Polza Test Clinic",
    nameNorm: "polza test clinic",
    category: "Healthcare",
    city: "Санкт-Петербург",
    citySlug: "санкт-петербург",
    address: "Невский 10",
    rating: 3.9,
    reviews: 12,
    website: null,
    host: null,
    phone: "+78121234567",
  },
  {
    name: "Bright CRM Partners",
    nameNorm: "bright crm partners",
    category: "CRM consulting",
    city: "New York",
    citySlug: "new-york",
    address: "5th Avenue 100",
    rating: 4.9,
    reviews: 128,
    website: "https://brightcrm.example/",
    host: "brightcrm.example",
    phone: "+12125550100",
  },
];

const pool = createPool();

try {
  for (const company of companies) {
    const categoryId = await upsertLookup("category", company.category);
    const cityId = await upsertLookup("city", company.city, company.citySlug);
    await pool.query(
      `INSERT INTO company(name, name_norm, category_id, city_id, address, rating, reviews_count, website, website_host, phone_e164, phone_raw, dedup_key, source_file, source_index, raw)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,'demo-seed',0,$12)
       ON CONFLICT (dedup_key) DO UPDATE SET
         rating = EXCLUDED.rating,
         reviews_count = EXCLUDED.reviews_count,
         website = EXCLUDED.website,
         website_host = EXCLUDED.website_host,
         phone_e164 = EXCLUDED.phone_e164,
         last_seen_at = now()`,
      [
        company.name,
        company.nameNorm,
        categoryId,
        cityId,
        company.address,
        company.rating,
        company.reviews,
        company.website,
        company.host,
        company.phone,
        `demo:${company.nameNorm}`,
        company,
      ],
    );
  }
  console.log(`demo seed applied: ${companies.length} companies`);
} finally {
  await pool.end();
}

async function upsertLookup(
  table: "category" | "city",
  name: string,
  slug = slugify(name),
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO ${table}(slug, name) VALUES($1, $2) ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
    [slug, name],
  );
  return Number(result.rows[0].id);
}

function slugify(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}
