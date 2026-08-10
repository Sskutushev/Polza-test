import { describe, expect, it } from "vitest";
import { escapeLike } from "@polza/db/companies";

describe("escapeLike", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapeLike("100%_ok\\")).toBe("100\\%\\_ok\\\\");
  });
});
