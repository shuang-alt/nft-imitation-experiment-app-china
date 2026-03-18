import { buildDashboardSummary, mergeDashboardDatasets } from "./dashboard";
import type {
  DashboardDataset,
  PageEventPayload,
  RespondentFinishPayload,
  RespondentRecord,
  RespondentStartPayload,
} from "./types";

type MockStore = {
  respondents: RespondentRecord[];
  pageEvents: PageEventPayload[];
  finishes: RespondentFinishPayload[];
};

declare global {
  var __NFT_EXPERIMENT_MOCK_STORE__: MockStore | undefined;
}

function getStore(): MockStore {
  if (!globalThis.__NFT_EXPERIMENT_MOCK_STORE__) {
    globalThis.__NFT_EXPERIMENT_MOCK_STORE__ = {
      respondents: [],
      pageEvents: [],
      finishes: [],
    };
  }

  return globalThis.__NFT_EXPERIMENT_MOCK_STORE__;
}

function respondentKey(studyId: string, respondentId: string) {
  return `${studyId}:${respondentId}`;
}

export function saveMockRespondentStart(payload: RespondentStartPayload) {
  const store = getStore();
  const key = respondentKey(payload.study_id, payload.respondent_id);
  const existingIndex = store.respondents.findIndex(
    (item) => respondentKey(item.study_id, item.respondent_id) === key,
  );

  const nextRecord: RespondentRecord = {
    ...store.respondents[existingIndex],
    ...payload,
  };

  if (existingIndex >= 0) {
    store.respondents.splice(existingIndex, 1, nextRecord);
  } else {
    store.respondents.push(nextRecord);
  }
}

export function saveMockPageEvent(payload: PageEventPayload) {
  const store = getStore();

  store.pageEvents.unshift(payload);
  saveMockRespondentStart({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: payload.entered_at,
    status: "in_progress",
  });

  const respondentIndex = store.respondents.findIndex(
    (item) =>
      item.respondent_id === payload.respondent_id &&
      item.study_id === payload.study_id,
  );

  if (respondentIndex >= 0) {
    store.respondents[respondentIndex] = {
      ...store.respondents[respondentIndex],
      last_page_number: Math.max(
        store.respondents[respondentIndex].last_page_number ?? 0,
        payload.page_number,
      ),
    };
  }
}

export function saveMockRespondentFinish(payload: RespondentFinishPayload) {
  const store = getStore();

  store.finishes.unshift(payload);
  saveMockRespondentStart({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: payload.finished_at,
    status: "in_progress",
  });

  const respondentIndex = store.respondents.findIndex(
    (item) =>
      item.respondent_id === payload.respondent_id &&
      item.study_id === payload.study_id,
  );

  if (respondentIndex >= 0) {
    store.respondents[respondentIndex] = {
      ...store.respondents[respondentIndex],
      status: "completed",
      finished_at: payload.finished_at,
    };
  }
}

export function getMockDashboardDataset(): DashboardDataset {
  const store = getStore();

  return mergeDashboardDatasets({
    respondents: [...store.respondents],
    pageEvents: [...store.pageEvents],
    finishes: [...store.finishes],
    storageMode: "mock",
    notices: [
      "Mock mode is active. Page events are logged to the server console and kept in in-memory demo storage.",
      "This browser also caches a local copy of submissions so the admin page can preview the payload structure without a live database.",
    ],
    updatedAt: new Date().toISOString(),
  });
}

export function getMockDashboardSummary() {
  return buildDashboardSummary(getMockDashboardDataset());
}
