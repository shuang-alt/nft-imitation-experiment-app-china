import { NextResponse } from "next/server";

import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { createMockApiBlockedResponse, createMockHealthStatus, isDevelopmentMockApiEnabled } from "@/lib/mock-api-guard";
import { getDashboardDataset } from "@/lib/storage";

export async function GET(request: Request) {
  if (!isDevelopmentMockApiEnabled()) {
    return createMockApiBlockedResponse();
  }

  if (!(await isAdminRequestAuthorized(request))) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const dataset = await getDashboardDataset();
  const health = createMockHealthStatus();

  return NextResponse.json(
    {
      ...health,
      respondentCount: dataset.respondents.length,
      submissionCount: dataset.pageEvents.length,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "x-backend-origin": "next-mock-api",
        "x-storage-mode": "mock",
      },
    },
  );
}
