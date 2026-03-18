import type {
  DashboardDataset,
  ResearchAnswerRow,
  ResearchExportBundle,
  RespondentRecord,
} from "./types";

function buildRespondentMap(respondents: RespondentRecord[]) {
  return new Map(
    respondents.map((respondent) => [
      `${respondent.study_id}:${respondent.respondent_id}`,
      respondent,
    ]),
  );
}

export function buildResearchAnswerRows(
  dataset: DashboardDataset,
): ResearchAnswerRow[] {
  const respondentMap = buildRespondentMap(dataset.respondents);

  return dataset.pageEvents
    .flatMap((pageEvent) => {
      const respondent = respondentMap.get(
        `${pageEvent.study_id}:${pageEvent.respondent_id}`,
      );

      return Object.entries(pageEvent.answers).map(([questionCode, responseValue]) => ({
        respondent_id: pageEvent.respondent_id,
        study_id: pageEvent.study_id,
        condition: pageEvent.condition,
        page_number: pageEvent.page_number,
        page_version: pageEvent.page_version,
        entered_at: pageEvent.entered_at,
        submitted_at: pageEvent.submitted_at,
        duration_ms: pageEvent.duration_ms,
        question_code: questionCode,
        response_value: responseValue,
        started_at: respondent?.started_at ?? pageEvent.entered_at,
        finished_at: respondent?.finished_at,
        completion_status: respondent?.status ?? "in_progress",
      }));
    })
    .sort((left, right) => {
      if (left.study_id !== right.study_id) {
        return left.study_id.localeCompare(right.study_id);
      }

      if (left.condition !== right.condition) {
        return left.condition.localeCompare(right.condition);
      }

      if (left.respondent_id !== right.respondent_id) {
        return left.respondent_id.localeCompare(right.respondent_id);
      }

      if (left.page_number !== right.page_number) {
        return left.page_number - right.page_number;
      }

      return left.question_code.localeCompare(right.question_code);
    });
}

export function buildResearchExportBundle(
  dataset: DashboardDataset,
): ResearchExportBundle {
  return {
    generated_at: new Date().toISOString(),
    storage_mode: dataset.storageMode,
    respondents: [...dataset.respondents].sort((left, right) =>
      left.started_at.localeCompare(right.started_at),
    ),
    page_submissions: [...dataset.pageEvents].sort((left, right) =>
      left.submitted_at.localeCompare(right.submitted_at),
    ),
    finishes: [...dataset.finishes].sort((left, right) =>
      left.finished_at.localeCompare(right.finished_at),
    ),
    answer_rows: buildResearchAnswerRows(dataset),
    notices: dataset.notices,
  };
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).replaceAll('"', '""');

  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n")
  ) {
    return `"${normalized}"`;
  }

  return normalized;
}

export function buildResearchCsv(dataset: DashboardDataset) {
  const rows = buildResearchAnswerRows(dataset);
  const header = [
    "respondent_id",
    "study_id",
    "condition",
    "started_at",
    "finished_at",
    "completion_status",
    "page_number",
    "page_version",
    "entered_at",
    "submitted_at",
    "duration_ms",
    "question_code",
    "response_value",
  ];

  const lines = rows.map((row) =>
    [
      row.respondent_id,
      row.study_id,
      row.condition,
      row.started_at,
      row.finished_at ?? "",
      row.completion_status,
      row.page_number,
      row.page_version,
      row.entered_at,
      row.submitted_at,
      row.duration_ms,
      row.question_code,
      row.response_value,
    ]
      .map((value) => escapeCsvValue(value))
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
