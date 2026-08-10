import Link from "next/link";
import {
  companyQuerySchema,
  findCompanies,
  getCompanyFacets,
  getCompanyStats,
} from "@polza/db/companies";
import { CompanyControls } from "./CompanyControls";
import { CompanyTable } from "./CompanyTable";
import { messages, parseLang } from "./i18n";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const flatParams = flattenParams(rawParams);
  const lang = parseLang(flatParams.lang);
  const t = messages[lang];
  const parsed = companyQuerySchema.parse(flatParams);
  const [result, facets, stats] = await Promise.all([
    findCompanies(parsed),
    getCompanyFacets(),
    getCompanyStats(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / parsed.limit));

  return (
    <main className="shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="hero-copy">{t.subtitle}</p>
        </div>
        <div className="hero-card">
          <span>{t.product}</span>
          <strong className="num">{stats.total}</strong>
          <small>{t.companies}</small>
        </div>
      </section>

      <section className="metric-grid" aria-label="Database metrics">
        <Metric
          label={t.websiteCoverage}
          value={`${percent(stats.withWebsite, stats.total)}%`}
        />
        <Metric
          label={t.phoneCoverage}
          value={`${percent(stats.withPhone, stats.total)}%`}
        />
        <Metric
          label={t.avgRating}
          value={stats.avgRating?.toFixed(2) ?? "—"}
        />
        <Metric
          label={t.totalReviews}
          value={formatNumber(stats.totalReviews)}
        />
        <Metric label={t.topCategory} value={stats.topCategory ?? "—"} />
      </section>

      <CompanyControls
        cities={facets.cities}
        categories={facets.categories}
        lang={lang}
        messages={t}
      />

      <div className="result-bar">
        <strong>
          {t.found}: <span className="num">{result.total}</span>
        </strong>
        <span>{t.demoHint}</span>
      </div>

      {result.rows.length === 0 ? (
        <div className="empty">
          <strong>{t.emptyTitle}</strong>
          <p>{t.emptyText}</p>
          <Link href={`/companies?lang=${lang}`}>{t.reset}</Link>
        </div>
      ) : (
        <CompanyTable rows={result.rows} messages={t} />
      )}

      <nav className="pagination">
        {parsed.page > 1 ? (
          <Link href={pageHref(parsed.page - 1, rawParams)}>{t.previous}</Link>
        ) : (
          <span />
        )}
        <span className="num">
          {t.page} {parsed.page} {t.of} {totalPages}
        </span>
        {parsed.page < totalPages ? (
          <Link href={pageHref(parsed.page + 1, rawParams)}>{t.next}</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong className="num">{value}</strong>
    </article>
  );
}

function flattenParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? (value[0] ?? "") : (value ?? ""),
    ]),
  );
}

function pageHref(
  page: number,
  current: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams(flattenParams(current));
  params.set("page", String(page));
  return `/companies?${params.toString()}`;
}

function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
