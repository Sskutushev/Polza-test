import Link from "next/link";
import { companyQuerySchema, findCompanies } from "@polza/db/companies";
import { SearchInput } from "./SearchInput";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const parsed = companyQuerySchema.parse(flattenParams(rawParams));
  const result = await findCompanies(parsed);
  const totalPages = Math.max(1, Math.ceil(result.total / parsed.limit));

  return (
    <main className="shell">
      <h1>Компании</h1>
      <p className="num">Найдено: {result.total}</p>
      <div className="toolbar">
        <SearchInput />
        <label>
          Сортировка
          <select defaultValue={parsed.sort} name="sort">
            <option value="name">Название</option>
            <option value="rating">Рейтинг</option>
            <option value="reviews">Отзывы</option>
          </select>
        </label>
        <label>
          Направление
          <select defaultValue={parsed.dir} name="dir">
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </label>
      </div>

      {result.rows.length === 0 ? (
        <div className="empty">
          <strong>Ничего не нашлось</strong>
          <p>Сбросьте поиск или измените фильтры.</p>
          <Link href="/companies">Сбросить фильтры</Link>
        </div>
      ) : (
        <table>
          <caption>Список компаний из базы</caption>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Город</th>
              <th>Рейтинг</th>
              <th>Отзывы</th>
              <th>Сайт</th>
              <th>Телефон</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.category ?? "—"}</td>
                <td>{company.city ?? "—"}</td>
                <td className="num">{company.rating?.toFixed(1) ?? "—"}</td>
                <td className="num">{company.reviewsCount ?? "—"}</td>
                <td>
                  {company.website ? (
                    <a href={company.website} rel="noopener noreferrer">
                      {company.websiteHost}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="num">{company.phoneE164 ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <nav className="pagination">
        {parsed.page > 1 ? (
          <Link href={pageHref(parsed.page - 1, rawParams)}>Назад</Link>
        ) : (
          <span />
        )}
        <span className="num">
          Страница {parsed.page} из {totalPages}
        </span>
        {parsed.page < totalPages ? (
          <Link href={pageHref(parsed.page + 1, rawParams)}>Вперёд</Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
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
