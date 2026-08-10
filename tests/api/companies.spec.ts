import { describe, expect, it } from "vitest";
import { companyQuerySchema } from "@polza/db/companies";

describe("company query contract", () => {
  it("rejects unsafe limits", () => {
    expect(companyQuerySchema.safeParse({ limit: "1000" }).success).toBe(false);
  });

  it("defaults pagination", () => {
    expect(companyQuerySchema.parse({}).page).toBe(1);
  });
});
