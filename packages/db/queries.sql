-- 1. Top 5 categories by company count. Companies without a category are shown
-- as "Без категории" because excluding them hides source-data quality issues.
SELECT
  COALESCE(category.name, 'Без категории') AS category,
  count(company.id) AS companies_count
FROM company
LEFT JOIN category ON category.id = company.category_id
GROUP BY COALESCE(category.name, 'Без категории')
ORDER BY companies_count DESC, category ASC
LIMIT 5;

-- 2. Average rating by city among companies with 10+ reviews. Rating NULL is
-- excluded from avg, but rated_companies keeps the sample size visible.
SELECT
  city.name AS city,
  round(avg(company.rating)::numeric, 2) AS avg_rating,
  count(company.id) FILTER (WHERE company.rating IS NOT NULL) AS rated_companies,
  count(company.id) AS companies_with_10_reviews
FROM company
JOIN city ON city.id = company.city_id
WHERE company.reviews_count >= 10
GROUP BY city.name
HAVING count(company.id) FILTER (WHERE company.rating IS NOT NULL) > 0
ORDER BY avg_rating DESC, city ASC;

-- 3. Share of companies with a website by category. "Has website" means
-- website_host is not NULL, so values like "-" or "нет" are not counted.
WITH by_category AS (
  SELECT
    COALESCE(category.name, 'Без категории') AS category,
    count(company.id) AS total,
    count(company.id) FILTER (WHERE company.website_host IS NOT NULL) AS with_site
  FROM company
  LEFT JOIN category ON category.id = company.category_id
  GROUP BY COALESCE(category.name, 'Без категории')
)
SELECT
  category,
  total,
  with_site,
  round(100.0 * with_site / NULLIF(total, 0), 1) AS pct_with_site
FROM by_category
ORDER BY pct_with_site DESC, total DESC, category ASC;
