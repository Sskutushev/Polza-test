export const issueDescriptions = {
  REQUIRED_MISSING: "Required field is missing",
  FIELD_UNKNOWN: "Source field is not mapped",
  RATING_INVALID: "Rating cannot be parsed",
  RATING_OUT_OF_RANGE: "Rating is outside the expected range",
  COUNT_INVALID: "Count cannot be parsed as a non-negative integer",
  PHONE_UNPARSEABLE: "Phone value cannot be normalized",
  WEBSITE_NOT_A_URL: "Website value is not a URL",
  EMAIL_SYNTAX_INVALID: "Email has invalid syntax",
  EMAIL_DISPOSABLE: "Email belongs to a disposable domain",
  EMAIL_ROLE_BASED: "Email looks role-based instead of personal",
  EMAIL_RESERVED_DOMAIN: "Email domain is reserved for examples or local use",
  EMAIL_NO_MX: "Email domain has no MX record",
  DUP_EXACT: "Exact duplicate row",
  DUP_FUZZY: "Potential fuzzy duplicate",
  ORPHAN_COMPANY_REF: "Review cannot be linked to a company",
  CSV_BAD_COLUMN_COUNT: "CSV row has unexpected column count",
  DATE_INVALID: "Date cannot be parsed"
} as const;

export type IssueCode = keyof typeof issueDescriptions;
