import { NextResponse } from "next/server";

import { createMockApiBlockedResponse, isDevelopmentMockApiEnabled } from "@/lib/mock-api-guard";
import { persistPageEvent } from "@/lib/storage";
import type { PageEventPayload } from "@/lib/types";

export async function POST(request: Request) {
  if (!isDevelopmentMockApiEnabled()) {
    return createMockApiBlockedResponse();
  }

  const payload = (await request.json()) as Partial<PageEventPayload>;

  if (
    !payload.respondent_id ||
    !payload.study_id ||
    !payload.condition ||
    typeof payload.page_number !== "number" ||
    !payload.page_version ||
    !payload.entered_at ||
    !payload.submitted_at ||
    typeof payload.duration_ms !== "number"
  ) {
    return NextResponse.json(
      {
        error: "Missing page event fields.",
      },
      { status: 400 },
    );
  }

  const result = await persistPageEvent({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    page_number: payload.page_number,
    page_version: payload.page_version,
    answers: payload.answers ?? {},
    entered_at: payload.entered_at,
    submitted_at: payload.submitted_at,
    duration_ms: payload.duration_ms,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "x-backend-origin": "next-mock-api",
      "x-storage-mode": "mock",
    },
  });
}
