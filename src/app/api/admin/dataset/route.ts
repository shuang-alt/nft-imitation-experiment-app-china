import { NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/admin-auth";
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

  return NextResponse.json(dataset, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
