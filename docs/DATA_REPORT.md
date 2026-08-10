# DATA_REPORT

## Companies JSON

- Source files: `page_001.json` ... `page_020.json`
- Rows read: 1000
- Companies inserted after deduplication: 994
- Rejected company rows: 0
- Categories: 22
- Cities: 20
- Companies with parsed website: 756 of 994, 76.1%
- Companies with normalized phone: 884 of 994, 88.9%

Sample loaded rows after mojibake repair:

| source_id | name              | category           | city            | rating | reviews | site               | phone        |
| --------- | ----------------- | ------------------ | --------------- | -----: | ------: | ------------------ | ------------ |
| c_000001  | ООО «Прайм Медиа» | Типография         | Челябинск       |    4.1 |     191 | —                  | +74952484440 |
| c_000002  | ООО «Сфера Групп» | Юридические услуги | Санкт-Петербург |      — |       0 | sfera-group-229.ru | +78125438491 |
| c_000003  | ООО «Формат Лаб»  | IT-интегратор      | Санкт-Петербург |    4.1 |      88 | format-lab-782.ru  | +79254505399 |

Top categories:

| category              | companies |
| --------------------- | --------: |
| IT-интегратор         |        94 |
| Оптовая торговля      |        79 |
| Рекламное агентство   |        76 |
| Строительная компания |        71 |
| Юридические услуги    |        63 |

Top cities:

| city            | companies | avg_rating |
| --------------- | --------: | ---------: |
| Москва          |       211 |       4.23 |
| Санкт-Петербург |       128 |       4.29 |
| Новосибирск     |        75 |       4.29 |
| Екатеринбург    |        64 |       4.28 |
| Нижний Новгород |        59 |       4.30 |

## review.csv

- Rows: 207
- Columns: 9
- Headers: `id`, `name`, `category`, `city`, `address`, `rating`, `reviews_count`, `site`, `phone`
- Review-like columns found: 0
- Email columns found: 0
- Text/body/comment columns found: 0
- Rows loaded into `review`: 0
- Rows quarantined: 207
- Quarantine code: `REVIEW_NOT_A_REVIEW_EXPORT`

Important shape facts:

| check                                                    | result |
| -------------------------------------------------------- | -----: |
| rows with id > `c_001000`                                |    199 |
| rows with id <= `c_001000`                               |      8 |
| empty ids                                                |      2 |
| duplicate ids                                            |      3 |
| invalid ratings (`N/A`, comma decimal, below 0, above 5) |      4 |
| empty site                                               |     60 |
| empty phone                                              |     22 |
| rows with mojibake text before repair                    |    144 |

Conclusion: `review.csv` is not a review export. It has the same company-shaped columns as the JSON source, lacks email/review text/date fields, mostly uses ids outside the company export range, and is therefore quarantined instead of being merged into `review`.
