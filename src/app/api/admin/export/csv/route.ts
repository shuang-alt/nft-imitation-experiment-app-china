import { NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { buildResearchCsv } from "@/lib/export";
import { getDashboardDataset } from "@/lib/storage";

export async function GET(request: Request) {
  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const dataset = await getDashboardDataset();
  const csv = buildResearchCsv(dataset);
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nft-imitation-answer-rows-${timestamp}.csv"`,
    },
  });
}
