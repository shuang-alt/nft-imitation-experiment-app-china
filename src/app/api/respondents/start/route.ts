import { NextResponse } from "next/server";

import { persistRespondentStart } from "@/lib/storage";
import type { RespondentStartPayload } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<RespondentStartPayload>;

  if (
    !payload.respondent_id ||
    !payload.study_id ||
    !payload.condition ||
    !payload.started_at
  ) {
    return NextResponse.json(
      {
        error: "Missing respondent start fields.",
      },
      { status: 400 },
    );
  }

  const result = await persistRespondentStart({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: payload.started_at,
    status: "in_progress",
  });

  return NextResponse.json(result);
}
