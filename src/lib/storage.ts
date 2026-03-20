import { getMockDashboardDataset, saveMockPageEvent, saveMockRespondentFinish, saveMockRespondentStart } from "./mock-storage";
import type {
  DashboardDataset,
  PageEventPayload,
  PersistResult,
  RespondentFinishPayload,
  RespondentStartPayload,
} from "./types";

function assertDevelopmentMockStorage() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  throw new Error(
    "Mock storage is disabled outside development. EdgeOne edge-functions must handle /api/* in production.",
  );
}

function logMockPayload(label: string, payload: unknown) {
  console.info(`[mock-storage] ${label}`, payload);
}

export async function persistRespondentStart(
  payload: RespondentStartPayload,
): Promise<PersistResult> {
  assertDevelopmentMockStorage();
  logMockPayload("respondent-start", payload);
  saveMockRespondentStart(payload);
  return { mode: "mock" };
}

export async function persistPageEvent(
  payload: PageEventPayload,
): Promise<PersistResult> {
  assertDevelopmentMockStorage();
  logMockPayload("page-event", payload);
  saveMockPageEvent(payload);
  return { mode: "mock" };
}

export async function persistRespondentFinish(
  payload: RespondentFinishPayload,
): Promise<PersistResult> {
  assertDevelopmentMockStorage();
  logMockPayload("respondent-finish", payload);
  saveMockRespondentFinish(payload);
  return { mode: "mock" };
}

export async function getDashboardDataset(): Promise<DashboardDataset> {
  assertDevelopmentMockStorage();
  const dataset = getMockDashboardDataset();

  return {
    ...dataset,
    notices: [
      "Local mock mode is active. EdgeOne Pages will override /api/* with edge-functions when deployed.",
      ...dataset.notices,
    ],
  };
}
