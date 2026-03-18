import { env, isDatabaseConfigured } from "./config";
import { getMockDashboardDataset, saveMockPageEvent, saveMockRespondentFinish, saveMockRespondentStart } from "./mock-storage";
import type {
  DashboardDataset,
  PageEventPayload,
  PersistResult,
  RespondentFinishPayload,
  RespondentRecord,
  RespondentStartPayload,
} from "./types";

type FetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  searchParams?: Record<string, string>;
  body?: unknown;
};

function getRestEndpoint(tableName: string, searchParams?: Record<string, string>) {
  const base = env.nextPublicDatabaseUrl.replace(/\/$/, "");
  const url = new URL(`${base}/rest/v1/${tableName}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function databaseRequest<T>(tableName: string, options: FetchOptions = {}) {
  const response = await fetch(getRestEndpoint(tableName, options.searchParams), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: env.databaseServiceRoleKey || env.nextPublicDatabaseAnonKey,
      Authorization: `Bearer ${env.databaseServiceRoleKey || env.nextPublicDatabaseAnonKey}`,
      Prefer:
        options.method === "POST"
          ? "resolution=merge-duplicates,return=representation"
          : options.method === "PATCH"
            ? "return=representation"
            : "count=exact",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Database request failed for ${tableName}: ${response.status} ${errorText}`,
    );
  }

  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}

function logMockPayload(label: string, payload: unknown) {
  console.info(`[mock-storage] ${label}`, payload);
}

async function insertPageResponseSnapshot(payload: PageEventPayload) {
  await databaseRequest(env.responsesTableName, {
    method: "POST",
    body: [
      {
        respondent_id: payload.respondent_id,
        study_id: payload.study_id,
        condition: payload.condition,
        page_number: payload.page_number,
        page_version: payload.page_version,
        answers: payload.answers,
        submitted_at: payload.submitted_at,
      },
    ],
  });
}

export async function persistRespondentStart(
  payload: RespondentStartPayload,
): Promise<PersistResult> {
  if (!isDatabaseConfigured()) {
    logMockPayload("respondent-start", payload);
    saveMockRespondentStart(payload);
    return { mode: "mock" };
  }

  try {
    await databaseRequest(env.respondentsTableName, {
      method: "POST",
      body: [payload],
    });

    return { mode: "database" };
  } catch (error) {
    console.error("[database-fallback] respondent-start", error);
    logMockPayload("respondent-start", payload);
    saveMockRespondentStart(payload);
    return { mode: "mock", fallback: true };
  }
}

export async function persistPageEvent(
  payload: PageEventPayload,
): Promise<PersistResult> {
  if (!isDatabaseConfigured()) {
    logMockPayload("page-event", payload);
    saveMockPageEvent(payload);
    return { mode: "mock" };
  }

  try {
    await Promise.all([
      databaseRequest(env.pageEventsTableName, {
        method: "POST",
        body: [payload],
      }),
      insertPageResponseSnapshot(payload),
    ]);

    return { mode: "database" };
  } catch (error) {
    console.error("[database-fallback] page-event", error);
    logMockPayload("page-event", payload);
    saveMockPageEvent(payload);
    return { mode: "mock", fallback: true };
  }
}

export async function persistRespondentFinish(
  payload: RespondentFinishPayload,
): Promise<PersistResult> {
  if (!isDatabaseConfigured()) {
    logMockPayload("respondent-finish", payload);
    saveMockRespondentFinish(payload);
    return { mode: "mock" };
  }

  try {
    await databaseRequest(env.respondentsTableName, {
      method: "PATCH",
      searchParams: {
        respondent_id: `eq.${payload.respondent_id}`,
        study_id: `eq.${payload.study_id}`,
      },
      body: {
        condition: payload.condition,
        finished_at: payload.finished_at,
        status: payload.status,
      },
    });

    return { mode: "database" };
  } catch (error) {
    console.error("[database-fallback] respondent-finish", error);
    logMockPayload("respondent-finish", payload);
    saveMockRespondentFinish(payload);
    return { mode: "mock", fallback: true };
  }
}

export async function getDashboardDataset(): Promise<DashboardDataset> {
  if (!isDatabaseConfigured()) {
    return getMockDashboardDataset();
  }

  try {
    const [respondents, pageEvents] = await Promise.all([
      databaseRequest<RespondentRecord[]>(env.respondentsTableName, {
        searchParams: {
          select:
            "respondent_id,study_id,condition,started_at,status,finished_at,last_page_number",
          order: "started_at.desc",
          limit: "500",
        },
      }),
      databaseRequest<PageEventPayload[]>(env.pageEventsTableName, {
        searchParams: {
          select:
            "respondent_id,study_id,condition,page_number,page_version,answers,entered_at,submitted_at,duration_ms",
          order: "submitted_at.desc",
          limit: "50",
        },
      }),
    ]);

    return {
      respondents,
      pageEvents,
      finishes: respondents
        .filter((respondent) => respondent.finished_at)
        .map((respondent) => ({
          respondent_id: respondent.respondent_id,
          study_id: respondent.study_id,
          condition: respondent.condition,
          finished_at: respondent.finished_at ?? respondent.started_at,
          status: "completed" as const,
        })),
      storageMode: "database",
      notices: [
        "Database mode is active. The admin dashboard is reading data through the REST placeholder integration.",
      ],
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[database-fallback] dashboard-summary", error);
    return {
      ...getMockDashboardDataset(),
      notices: [
        "Database reads failed, so the dashboard fell back to mock storage for this request.",
      ],
    };
  }
}
