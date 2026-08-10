import { describe, expect, it } from "vitest";

describe("queries", () => {
  it("keeps SQL artifacts present", async () => {
    const sql = await import("node:fs/promises").then((fs) => fs.readFile("packages/db/queries.sql", "utf8"));
    expect(sql).toContain("Top 5 categories");
    expect(sql).toContain("Average rating by city");
    expect(sql).toContain("Share of companies with a website");
  });
});
