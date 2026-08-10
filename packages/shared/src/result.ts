import type { IssueCode } from "./issues.js";

export type IssueSeverity = "error" | "warning" | "info";

export type SourceRef = {
  file: string;
  index: number;
};

export type Issue = {
  code: IssueCode;
  severity: IssueSeverity;
  field?: string;
  rawValue?: unknown;
  message: string;
  sourceRef?: SourceRef;
};

export type Parsed<T> = {
  value: T | null;
  issues: Issue[];
};

export function ok<T>(value: T, issues: Issue[] = []): Parsed<T> {
  return { value, issues };
}

export function fail<T>(issue: Issue): Parsed<T> {
  return { value: null, issues: [issue] };
}
