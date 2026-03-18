import type {
  DashboardDataset,
  DashboardSubmission,
  DashboardSummary,
  RespondentFinishPayload,
  RespondentRecord,
} from "./types";

function respondentKey(studyId: string, respondentId: string) {
  return `${studyId}:${respondentId}`;
}

function pageEventKey(datasetKey: {
  respondent_id: string;
  study_id: string;
  page_number: number;
  submitted_at: string;
}) {
  return `${respondentKey(datasetKey.study_id, datasetKey.respondent_id)}:${datasetKey.page_number}:${datasetKey.submitted_at}`;
}

function finishKey(finish: RespondentFinishPayload) {
  return `${respondentKey(finish.study_id, finish.respondent_id)}:${finish.finished_at}`;
}

export function mergeDashboardDatasets(
  ...datasets: DashboardDataset[]
): DashboardDataset {
  const respondentMap = new Map<string, RespondentRecord>();
  const pageEventMap = new Map<string, DashboardDataset["pageEvents"][number]>();
  const finishMap = new Map<string, RespondentFinishPayload>();
  const notices = new Set<string>();
  let storageMode: DashboardDataset["storageMode"] = "mock";

  for (const dataset of datasets) {
    storageMode =
      dataset.storageMode === "edgeone-kv" ? "edgeone-kv" : storageMode;

    for (const notice of dataset.notices) {
      notices.add(notice);
    }

    for (const respondent of dataset.respondents) {
      const key = respondentKey(respondent.study_id, respondent.respondent_id);
      const existing = respondentMap.get(key);

      respondentMap.set(key, {
        ...(existing ?? {}),
        ...respondent,
      });
    }

    for (const pageEvent of dataset.pageEvents) {
      pageEventMap.set(pageEventKey(pageEvent), pageEvent);
    }

    for (const finish of dataset.finishes) {
      finishMap.set(finishKey(finish), finish);
    }
  }

  for (const pageEvent of pageEventMap.values()) {
    const key = respondentKey(pageEvent.study_id, pageEvent.respondent_id);
    const existing = respondentMap.get(key);

    respondentMap.set(key, {
      respondent_id: pageEvent.respondent_id,
      study_id: pageEvent.study_id,
      condition: pageEvent.condition,
      started_at: existing?.started_at ?? pageEvent.entered_at,
      status: existing?.status ?? "in_progress",
      finished_at: existing?.finished_at,
      last_page_number: Math.max(existing?.last_page_number ?? 0, pageEvent.page_number),
    });
  }

  for (const finish of finishMap.values()) {
    const key = respondentKey(finish.study_id, finish.respondent_id);
    const existing = respondentMap.get(key);

    respondentMap.set(key, {
      respondent_id: finish.respondent_id,
      study_id: finish.study_id,
      condition: finish.condition,
      started_at: existing?.started_at ?? finish.finished_at,
      status: "completed",
      finished_at: finish.finished_at,
      last_page_number: existing?.last_page_number,
    });
  }

  return {
    respondents: Array.from(respondentMap.values()),
    pageEvents: Array.from(pageEventMap.values()).sort((left, right) =>
      right.submitted_at.localeCompare(left.submitted_at),
    ),
    finishes: Array.from(finishMap.values()).sort((left, right) =>
      right.finished_at.localeCompare(left.finished_at),
    ),
    storageMode,
    notices: Array.from(notices),
    updatedAt: new Date().toISOString(),
  };
}

export function buildDashboardSummary(dataset: DashboardDataset): DashboardSummary {
  const studyCounts: DashboardSummary["studyCounts"] = {
    study1: 0,
    study2: 0,
  };
  const conditionCounts: DashboardSummary["conditionCounts"] = {
    control: 0,
    treatment: 0,
  };
  const studyConditionCounts: DashboardSummary["studyConditionCounts"] = {
    study1: {
      control: 0,
      treatment: 0,
    },
    study2: {
      control: 0,
      treatment: 0,
    },
  };

  for (const respondent of dataset.respondents) {
    studyCounts[respondent.study_id] += 1;
    conditionCounts[respondent.condition] += 1;
    studyConditionCounts[respondent.study_id][respondent.condition] += 1;
  }

  const latestSubmissions: DashboardSubmission[] = [
    ...dataset.pageEvents.map((pageEvent) => ({
      key: pageEventKey(pageEvent),
      respondentId: pageEvent.respondent_id,
      studyId: pageEvent.study_id,
      condition: pageEvent.condition,
      eventType: "page_event" as const,
      timestamp: pageEvent.submitted_at,
      pageNumber: pageEvent.page_number,
      pageVersion: pageEvent.page_version,
    })),
    ...dataset.finishes.map((finish) => ({
      key: finishKey(finish),
      respondentId: finish.respondent_id,
      studyId: finish.study_id,
      condition: finish.condition,
      eventType: "finish" as const,
      timestamp: finish.finished_at,
    })),
  ]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 12);

  return {
    totalRespondents: dataset.respondents.length,
    completedRespondents: dataset.respondents.filter(
      (respondent) => respondent.status === "completed",
    ).length,
    studyCounts,
    conditionCounts,
    studyConditionCounts,
    latestSubmissions,
    storageMode: dataset.storageMode,
    notices: dataset.notices,
    updatedAt: dataset.updatedAt,
  };
}
