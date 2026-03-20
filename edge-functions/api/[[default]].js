const ADMIN_SESSION_COOKIE = "nft_experiment_admin";
const KV_BINDING = "NFT_EXPERIMENT_KV";
const KEY_PREFIXES = {
  respondent: "respondent_",
  submission: "submission_",
};
const STORAGE_MODE = "edgeone-kv";
const BACKEND_ORIGIN = "edge-functions";
const LIST_LIMIT = 256;
const PLACEHOLDER_PREFIXES = ["__", "<", "[", "TODO", "YOUR_"];

function getKvBindingState(context) {
  const kv = globalThis[KV_BINDING] ?? context.env?.[KV_BINDING];
  const hasKvBinding =
    !!kv && typeof kv.get === "function" && typeof kv.put === "function";

  return {
    kv: hasKvBinding ? kv : null,
    hasKvBinding,
  };
}

function buildBackendHeaders(hasKvBinding) {
  return {
    "x-storage-mode": hasKvBinding ? STORAGE_MODE : "missing",
    "x-backend-origin": BACKEND_ORIGIN,
    "x-kv-binding": hasKvBinding ? KV_BINDING : "missing",
    "x-kv-binding-name": KV_BINDING,
  };
}

function jsonResponse(payload, init = {}, options = {}) {
  const hasKvBinding = options.hasKvBinding ?? true;

  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...buildBackendHeaders(hasKvBinding),
      ...(init.headers ?? {}),
    },
  });
}

function textResponse(body, init = {}, options = {}) {
  const hasKvBinding = options.hasKvBinding ?? true;

  return new Response(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...buildBackendHeaders(hasKvBinding),
      ...(init.headers ?? {}),
    },
  });
}

function isConfiguredValue(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_PREFIXES.some((prefix) =>
    normalized.toUpperCase().startsWith(prefix.toUpperCase()),
  );
}

function getEnvValue(context, key) {
  const value = context.env?.[key];
  return typeof value === "string" ? value : "";
}

function kvBindingMissingPayload() {
  return {
    ok: false,
    error: `KV namespace binding ${KV_BINDING} is missing`,
    storageMode: "missing",
    backendOrigin: BACKEND_ORIGIN,
    hasKvBinding: false,
    kvBindingName: KV_BINDING,
    notices: [],
    warnings: [
      `Formal backend is running in Edge Functions, but KV namespace binding ${KV_BINDING} is missing.`,
    ],
  };
}

function kvBindingMissingResponse() {
  return jsonResponse(kvBindingMissingPayload(), { status: 503 }, { hasKvBinding: false });
}

function padPageNumber(pageNumber) {
  return String(pageNumber).padStart(2, "0");
}

function encodeKeyPart(value) {
  return Array.from(new TextEncoder().encode(String(value)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function respondentKey(studyId, condition, respondentId) {
  return `${KEY_PREFIXES.respondent}${studyId}_${condition}_${encodeKeyPart(respondentId)}`;
}

function submissionKey(studyId, condition, respondentId, pageNumber) {
  return `${KEY_PREFIXES.submission}${studyId}_${condition}_${encodeKeyPart(respondentId)}_${padPageNumber(pageNumber)}`;
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function createAdminSessionToken(context) {
  const password = getEnvValue(context, "ADMIN_DASHBOARD_PASSWORD");
  const secret = getEnvValue(context, "ADMIN_SESSION_SECRET") || password;

  if (!isConfiguredValue(password)) {
    return "";
  }

  return sha256Hex(`${password}::${secret}::nft-imitation-admin`);
}

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) {
    return new Map();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [rawKey, ...rawValue] = entry.split("=");
        return [rawKey, decodeURIComponent(rawValue.join("=") ?? "")];
      }),
  );
}

function getPasswordFromRequest(request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-admin-password")?.trim() ?? "";
}

async function isAdminAuthorized(context) {
  const password = getEnvValue(context, "ADMIN_DASHBOARD_PASSWORD");

  if (!isConfiguredValue(password)) {
    return true;
  }

  const requestPassword = getPasswordFromRequest(context.request);

  if (requestPassword && requestPassword === password) {
    return true;
  }

  const cookies = parseCookieHeader(context.request.headers.get("cookie"));
  const cookieValue = cookies.get(ADMIN_SESSION_COOKIE);

  if (!cookieValue) {
    return false;
  }

  return cookieValue === (await createAdminSessionToken(context));
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isStudyId(value) {
  return value === "study1" || value === "study2";
}

function isCondition(value) {
  return value === "control" || value === "treatment";
}

function isIsoTimestamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

async function readJsonValue(kv, key) {
  const raw = await kv.get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function listAllKeys(kv, prefix) {
  const keys = [];
  let cursor = undefined;

  while (true) {
    const result = await kv.list({
      prefix,
      limit: LIST_LIMIT,
      ...(cursor ? { cursor } : {}),
    });

    const listedKeys = Array.isArray(result?.keys)
      ? result.keys
          .map((entry) => entry?.name ?? entry?.key ?? "")
          .filter(Boolean)
      : [];
    keys.push(...listedKeys);

    const nextCursor =
      typeof result?.cursor === "string" && result.cursor ? result.cursor : undefined;
    const isComplete =
      result?.list_complete === true ||
      result?.complete === true ||
      !nextCursor ||
      listedKeys.length === 0;

    if (isComplete) {
      break;
    }

    cursor = nextCursor;
  }

  return keys;
}

async function listJsonValues(kv, prefix) {
  const keys = await listAllKeys(kv, prefix);
  const values = await Promise.all(keys.map((key) => readJsonValue(kv, key)));

  return values.filter(Boolean);
}

function buildFinishes(respondents) {
  return respondents
    .filter((respondent) => respondent.finished_at)
    .map((respondent) => ({
      respondent_id: respondent.respondent_id,
      study_id: respondent.study_id,
      condition: respondent.condition,
      finished_at: respondent.finished_at,
      status: "completed",
    }))
    .sort((left, right) => right.finished_at.localeCompare(left.finished_at));
}

function buildResearchAnswerRows(dataset) {
  const respondentMap = new Map(
    dataset.respondents.map((respondent) => [
      `${respondent.study_id}:${respondent.respondent_id}`,
      respondent,
    ]),
  );

  return dataset.pageEvents
    .flatMap((pageEvent) => {
      const respondent = respondentMap.get(
        `${pageEvent.study_id}:${pageEvent.respondent_id}`,
      );

      return Object.entries(pageEvent.answers ?? {}).map(
        ([questionCode, responseValue]) => ({
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
        }),
      );
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

function buildResearchCsv(dataset) {
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
  const rows = buildResearchAnswerRows(dataset);

  const csvLines = rows.map((row) =>
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
      .map((value) => {
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
      })
      .join(","),
  );

  return [header.join(","), ...csvLines].join("\n");
}

async function buildDataset(kv) {
  const [respondents, pageEvents] = await Promise.all([
    listJsonValues(kv, KEY_PREFIXES.respondent),
    listJsonValues(kv, KEY_PREFIXES.submission),
  ]);

  return {
    respondents: respondents.sort((left, right) =>
      right.started_at.localeCompare(left.started_at),
    ),
    pageEvents: pageEvents.sort((left, right) =>
      right.submitted_at.localeCompare(left.submitted_at),
    ),
    finishes: buildFinishes(respondents),
    storageMode: STORAGE_MODE,
    notices: [
      `EdgeOne Pages KV mode is active via binding ${KV_BINDING}.`,
      "All survey saves and admin reads use the same edge-functions KV backend.",
    ],
    updatedAt: new Date().toISOString(),
  };
}

function buildHealthPayload(context, overrides = {}) {
  const { hasKvBinding } = getKvBindingState(context);

  return {
    ok: overrides.ok ?? hasKvBinding,
    storageMode: overrides.storageMode ?? (hasKvBinding ? STORAGE_MODE : "missing"),
    backendOrigin: BACKEND_ORIGIN,
    hasKvBinding,
    kvBindingName: KV_BINDING,
    respondentCount: overrides.respondentCount,
    submissionCount: overrides.submissionCount,
    notices: overrides.notices ?? [],
    warnings: overrides.warnings ?? (hasKvBinding ? [] : kvBindingMissingPayload().warnings),
    error: overrides.error,
  };
}

async function persistRespondentStart(context, payload) {
  const { kv, hasKvBinding } = getKvBindingState(context);

  if (
    !payload ||
    !payload.respondent_id ||
    !isStudyId(payload.study_id) ||
    !isCondition(payload.condition) ||
    !isIsoTimestamp(payload.started_at)
  ) {
    return jsonResponse(
      {
        error: "Missing or invalid respondent start fields.",
      },
      { status: 400 },
      { hasKvBinding },
    );
  }

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const key = respondentKey(
    payload.study_id,
    payload.condition,
    payload.respondent_id,
  );
  const existing = await readJsonValue(kv, key);
  const record = {
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: payload.started_at,
    finished_at: null,
    status: "in_progress",
    last_page_number: existing?.last_page_number ?? 0,
  };

  await kv.put(key, JSON.stringify(record));

  return jsonResponse(
    {
      mode: STORAGE_MODE,
    },
    {},
    { hasKvBinding },
  );
}

async function persistPageEvent(context, payload) {
  const { kv, hasKvBinding } = getKvBindingState(context);

  if (
    !payload ||
    !payload.respondent_id ||
    !isStudyId(payload.study_id) ||
    !isCondition(payload.condition) ||
    !Number.isInteger(payload.page_number) ||
    !payload.page_version ||
    !isIsoTimestamp(payload.entered_at) ||
    !isIsoTimestamp(payload.submitted_at) ||
    !isFiniteNumber(payload.duration_ms)
  ) {
    return jsonResponse(
      {
        error: "Missing or invalid page event fields.",
      },
      { status: 400 },
      { hasKvBinding },
    );
  }

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const respondentStorageKey = respondentKey(
    payload.study_id,
    payload.condition,
    payload.respondent_id,
  );
  const pageStorageKey = submissionKey(
    payload.study_id,
    payload.condition,
    payload.respondent_id,
    payload.page_number,
  );
  const existingRespondent = await readJsonValue(kv, respondentStorageKey);
  const respondentRecord = {
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: existingRespondent?.started_at ?? payload.entered_at,
    finished_at: existingRespondent?.finished_at ?? null,
    status: existingRespondent?.finished_at ? "completed" : "in_progress",
    last_page_number: Math.max(
      existingRespondent?.last_page_number ?? 0,
      payload.page_number,
    ),
  };
  const submissionRecord = {
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    page_number: payload.page_number,
    page_version: payload.page_version,
    answers:
      payload.answers && typeof payload.answers === "object" ? payload.answers : {},
    entered_at: payload.entered_at,
    submitted_at: payload.submitted_at,
    duration_ms: payload.duration_ms,
  };

  await Promise.all([
    kv.put(respondentStorageKey, JSON.stringify(respondentRecord)),
    kv.put(pageStorageKey, JSON.stringify(submissionRecord)),
  ]);

  return jsonResponse(
    {
      mode: STORAGE_MODE,
    },
    {},
    { hasKvBinding },
  );
}

async function persistRespondentFinish(context, payload) {
  const { kv, hasKvBinding } = getKvBindingState(context);

  if (
    !payload ||
    !payload.respondent_id ||
    !isStudyId(payload.study_id) ||
    !isCondition(payload.condition) ||
    !isIsoTimestamp(payload.finished_at)
  ) {
    return jsonResponse(
      {
        error: "Missing or invalid respondent finish fields.",
      },
      { status: 400 },
      { hasKvBinding },
    );
  }

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const key = respondentKey(
    payload.study_id,
    payload.condition,
    payload.respondent_id,
  );
  const existing = await readJsonValue(kv, key);
  const record = {
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: existing?.started_at ?? payload.finished_at,
    finished_at: payload.finished_at,
    status: "completed",
    last_page_number: existing?.last_page_number ?? 0,
  };

  await kv.put(key, JSON.stringify(record));

  return jsonResponse(
    {
      mode: STORAGE_MODE,
    },
    {},
    { hasKvBinding },
  );
}

async function handleAdminDataset(context) {
  if (!(await isAdminAuthorized(context))) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  }

  const { kv, hasKvBinding } = getKvBindingState(context);

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const dataset = await buildDataset(kv);
  return jsonResponse(dataset, {}, { hasKvBinding });
}

async function handleAdminHealth(context) {
  if (!(await isAdminAuthorized(context))) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  }

  const { kv, hasKvBinding } = getKvBindingState(context);

  if (!kv) {
    return jsonResponse(buildHealthPayload(context, kvBindingMissingPayload()), {
      status: 503,
    }, { hasKvBinding });
  }

  const dataset = await buildDataset(kv);

  return jsonResponse(
    buildHealthPayload(context, {
      ok: true,
      respondentCount: dataset.respondents.length,
      submissionCount: dataset.pageEvents.length,
      notices: dataset.notices,
      warnings: [],
    }),
    {},
    { hasKvBinding },
  );
}

async function handleAdminJsonExport(context) {
  if (!(await isAdminAuthorized(context))) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  }

  const { kv, hasKvBinding } = getKvBindingState(context);

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const dataset = await buildDataset(kv);
  const payload = {
    generated_at: new Date().toISOString(),
    storage_mode: STORAGE_MODE,
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
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return jsonResponse(
    payload,
    {
      headers: {
        "content-disposition": `attachment; filename="nft-imitation-export-${timestamp}.json"`,
      },
    },
    { hasKvBinding },
  );
}

async function handleAdminCsvExport(context) {
  if (!(await isAdminAuthorized(context))) {
    return jsonResponse(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  }

  const { kv, hasKvBinding } = getKvBindingState(context);

  if (!kv) {
    return kvBindingMissingResponse();
  }

  const dataset = await buildDataset(kv);
  const csv = buildResearchCsv(dataset);
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return textResponse(
    csv,
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="nft-imitation-answer-rows-${timestamp}.csv"`,
      },
    },
    { hasKvBinding },
  );
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  try {
    if (pathname === "/api/respondents/start" && context.request.method === "POST") {
      return persistRespondentStart(context, await parseJsonBody(context.request));
    }

    if (pathname === "/api/page-events" && context.request.method === "POST") {
      return persistPageEvent(context, await parseJsonBody(context.request));
    }

    if (pathname === "/api/respondents/finish" && context.request.method === "POST") {
      return persistRespondentFinish(context, await parseJsonBody(context.request));
    }

    if (pathname === "/api/admin/dataset" && context.request.method === "GET") {
      return handleAdminDataset(context);
    }

    if (pathname === "/api/admin/health" && context.request.method === "GET") {
      return handleAdminHealth(context);
    }

    if (pathname === "/api/admin/export/json" && context.request.method === "GET") {
      return handleAdminJsonExport(context);
    }

    if (pathname === "/api/admin/export/csv" && context.request.method === "GET") {
      return handleAdminCsvExport(context);
    }

    return jsonResponse(
      {
        error: `No API route matched ${pathname}.`,
      },
      { status: 404 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown edge-functions error.",
      },
      { status: 500 },
      { hasKvBinding: getKvBindingState(context).hasKvBinding },
    );
  }
}
