import { NextResponse } from "next/server";
import { companyQuerySchema, findCompanies } from "@polza/db/companies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = companyQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_QUERY", message: "Invalid query", details: parsed.error.flatten() } }, { status: 400 });
  }
  const result = await findCompanies(parsed.data);
  return NextResponse.json({
    data: result.rows,
    meta: {
      page: parsed.data.page,
      limit: parsed.data.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / parsed.data.limit)
    }
  });
}
