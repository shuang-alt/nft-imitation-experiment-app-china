import { env, isConfiguredValue } from "./config";
import type { FinalSubmissionBackupPayload } from "./types";

export const FIREBASE_SURVEY_SUBMISSIONS_PATH = "/survey_submissions.json";
export const FIREBASE_PAGE_EVENTS_PATH = "/page_events.json";

function getFirebaseDatabaseUrl() {
  const databaseUrl = env.firebaseDatabaseUrl.trim().replace(/\/+$/, "");

  if (!isConfiguredValue(databaseUrl)) {
    throw new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL is missing.");
  }

  return databaseUrl;
}

export async function backupCompletedSubmissionToFirebase(
  payload: FinalSubmissionBackupPayload,
) {
  const databaseUrl = getFirebaseDatabaseUrl();
  const response = await fetch(
    `${databaseUrl}${FIREBASE_SURVEY_SUBMISSIONS_PATH}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Firebase backup request failed: ${response.status}`);
  }

  const data = (await response.json()) as { name?: string };

  if (!data?.name) {
    throw new Error("Firebase backup response is missing a record key.");
  }

  return {
    key: data.name,
    path: FIREBASE_SURVEY_SUBMISSIONS_PATH,
  };
}

export async function backupPageEventToFirebase(payload: {
  backup_version: string;
  respondent_id: string;
  study_id: string;
  condition: string;
  page_number: number;
  page_version: string;
  answers: Record<string, unknown>;
  entered_at: string;
  submitted_at: string;
  duration_ms: number;
  source: string;
  pathname: string;
  userAgent: string;
  firebase_target_path: string;
}) {
  const databaseUrl = getFirebaseDatabaseUrl();
  const response = await fetch(`${databaseUrl}${FIREBASE_PAGE_EVENTS_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Firebase page-event backup request failed: ${response.status}`);
  }

  const data = (await response.json()) as { name?: string };

  if (!data?.name) {
    throw new Error("Firebase page-event backup response is missing a record key.");
  }

  return {
    key: data.name,
    path: FIREBASE_PAGE_EVENTS_PATH,
  };
}
