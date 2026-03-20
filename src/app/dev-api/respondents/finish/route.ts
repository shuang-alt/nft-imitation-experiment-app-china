import { NextResponse } from "next/server";

import { createMockApiBlockedResponse, isDevelopmentMockApiEnabled } from "@/lib/mock-api-guard";
import { persistRespondentFinish } from "@/lib/storage";
import type { RespondentFinishPayload } from "@/lib/types";

export async function POST(request: Request) {
  if (!isDevelopmentMockApiEnabled()) {
    return createMockApiBlockedResponse();
  }

  const payload = (await request.json()) as Partial<RespondentFinishPayload>;

  if (
    !payload.respondent_id ||
    !payload.study_id ||
    !payload.condition ||
    !payload.finished_at
  ) {
    return NextResponse.json(
      {
        error: "Missing respondent finish fields.",
      },
      { status: 400 },
    );
  }

  const result = await persistRespondentFinish({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    finished_at: payload.finished_at,
    status: "completed",
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
      "x-backend-origin": "next-mock-api",
      "x-storage-mode": "mock",
    },
  });
}
