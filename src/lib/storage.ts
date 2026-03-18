import { getMockDashboardDataset, saveMockPageEvent, saveMockRespondentFinish, saveMockRespondentStart } from "./mock-storage";
import type {
  DashboardDataset,
  PageEventPayload,
  PersistResult,
  RespondentFinishPayload,
  RespondentStartPayload,
} from "./types";

function logMockPayload(label: string, payload: unknown) {
  console.info(`[mock-storage] ${label}`, payload);
}

export async function persistRespondentStart(
  payload: RespondentStartPayload,
): Promise<PersistResult> {
  logMockPayload("respondent-start", payload);
  saveMockRespondentStart(payload);
  return { mode: "mock" };
}

export async function persistPageEvent(
  payload: PageEventPayload,
): Promise<PersistResult> {
  logMockPayload("page-event", payload);
  saveMockPageEvent(payload);
  return { mode: "mock" };
}

export async function persistRespondentFinish(
  payload: RespondentFinishPayload,
): Promise<PersistResult> {
  logMockPayload("respondent-finish", payload);
  saveMockRespondentFinish(payload);
  return { mode: "mock" };
}

export async function getDashboardDataset(): Promise<DashboardDataset> {
  const dataset = getMockDashboardDataset();

  return {
    ...dataset,
    notices: [
      "Local mock mode is active. EdgeOne Pages will override /api/* with edge-functions when deployed.",
      ...dataset.notices,
    ],
  };
}
