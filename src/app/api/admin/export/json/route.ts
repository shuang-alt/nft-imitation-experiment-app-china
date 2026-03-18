import { NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { buildResearchExportBundle } from "@/lib/export";
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
  const payload = buildResearchExportBundle(dataset);
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="nft-imitation-export-${timestamp}.json"`,
    },
  });
}
