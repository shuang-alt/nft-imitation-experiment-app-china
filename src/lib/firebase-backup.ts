import { env, isConfiguredValue } from "./config";
import type { FinalSubmissionBackupPayload } from "./types";

export const FIREBASE_SURVEY_SUBMISSIONS_PATH = "/survey_submissions.json";

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
