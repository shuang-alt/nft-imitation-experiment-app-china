import { mergeDashboardDatasets } from "./dashboard";
import type {
  AnswerRecord,
  Condition,
  DashboardDataset,
  FirebaseBackupReceipt,
  PageEventPayload,
  RespondentFinishPayload,
  RespondentSession,
  RespondentStartPayload,
  StoredPageSubmission,
  StudySessionBootstrap,
  StudyId,
} from "./types";

const SESSION_PREFIX = "nft-imitation-session";
const RESPONDENT_CACHE_KEY = "nft-imitation-admin-respondents";
const PAGE_EVENT_CACHE_KEY = "nft-imitation-admin-page-events";
const FINISH_CACHE_KEY = "nft-imitation-admin-finishes";
const storageListeners = new Set<() => void>();
const parsedStorageCache = new Map<string, { raw: string | null; value: unknown }>();
const sessionSnapshotCache = new Map<
  string,
  { raw: string | null; value: RespondentSession | null }
>();
let dashboardDatasetCache:
  | {
      signature: string;
      value: DashboardDataset;
    }
  | undefined;

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    const cached = parsedStorageCache.get(key) as
      | {
          raw: string | null;
          value: T;
        }
      | undefined;

    if (cached && cached.raw === raw) {
      return cached.value;
    }

    const value = raw ? (JSON.parse(raw) as T) : fallback;
    parsedStorageCache.set(key, {
      raw,
      value,
    });

    return value;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  const raw = JSON.stringify(value);
  window.localStorage.setItem(key, raw);
  parsedStorageCache.set(key, {
    raw,
    value,
  });
  dashboardDatasetCache = undefined;
  storageListeners.forEach((listener) => listener());
}

function sessionStorageKey(studyId: StudyId) {
  return `${SESSION_PREFIX}:${studyId}`;
}

function scopedSessionStorageKey(studyId: StudyId, condition: Condition) {
  return `${sessionStorageKey(studyId)}:${condition}`;
}

function ensureDrafts(
  value: Partial<RespondentSession> | null,
  studyId: StudyId,
  condition: Condition,
) {
  if (!value) {
    return null;
  }

  return {
    respondentId:
      value.respondentId ?? `resp_${studyId}_${condition}_${crypto.randomUUID()}`,
    studyId,
    condition,
    startedAt: value.startedAt ?? new Date().toISOString(),
    currentPage: value.currentPage ?? 1,
    completedAt: value.completedAt,
    pageDrafts: value.pageDrafts ?? {},
    pageSubmissions: value.pageSubmissions ?? {},
    firebaseBackup: value.firebaseBackup,
  } satisfies RespondentSession;
}

export function readStudySession(studyId: StudyId, condition: Condition) {
  return ensureDrafts(
    readJson<Partial<RespondentSession> | null>(
      scopedSessionStorageKey(studyId, condition),
      null,
    ),
    studyId,
    condition,
  );
}

export function getOrCreateStudySession(studyId: StudyId, condition: Condition) {
  const existing = readStudySession(studyId, condition);

  if (existing) {
    return {
      session: existing,
      isNew: false,
    };
  }

  const session: RespondentSession = {
    respondentId: `resp_${studyId}_${condition}_${crypto.randomUUID()}`,
    studyId,
    condition,
    startedAt: new Date().toISOString(),
    currentPage: 1,
    pageDrafts: {},
    pageSubmissions: {},
  };

  writeJson(scopedSessionStorageKey(studyId, condition), session);

  return {
    session,
    isNew: true,
  };
}

export function ensureStudySession(studyId: StudyId, condition: Condition) {
  return getOrCreateStudySession(studyId, condition);
}

export function bootstrapStudySession(
  studyId: StudyId,
  condition: Condition,
  seed: StudySessionBootstrap,
) {
  const existing = readStudySession(studyId, condition);
  const shouldReset =
    seed.reset ||
    !existing ||
    existing.respondentId !== seed.respondentId;

  if (!shouldReset && existing) {
    return {
      session: existing,
      isNew: false,
    };
  }

  const session: RespondentSession = {
    respondentId: seed.respondentId,
    studyId,
    condition,
    startedAt: seed.startedAt ?? new Date().toISOString(),
    currentPage: seed.currentPage ?? 1,
    completedAt: undefined,
    pageDrafts: {},
    pageSubmissions: {},
  };

  writeJson(scopedSessionStorageKey(studyId, condition), session);

  return {
    session,
    isNew: true,
  };
}

export function getStudySessionSnapshot(studyId: StudyId, condition: Condition) {
  if (!isBrowser()) {
    return null;
  }

  const key = scopedSessionStorageKey(studyId, condition);
  const raw = window.localStorage.getItem(key);
  const cached = sessionSnapshotCache.get(key);

  if (cached && cached.raw === raw) {
    return cached.value;
  }

  const value = ensureDrafts(
    raw ? (JSON.parse(raw) as Partial<RespondentSession>) : null,
    studyId,
    condition,
  );
  sessionSnapshotCache.set(key, {
    raw,
    value,
  });

  return value;
}

export function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);

  if (isBrowser()) {
    window.addEventListener("storage", listener);
  }

  return () => {
    storageListeners.delete(listener);

    if (isBrowser()) {
      window.removeEventListener("storage", listener);
    }
  };
}

export function saveStudyDraft(
  studyId: StudyId,
  condition: Condition,
  pageNumber: number,
  answers: AnswerRecord,
) {
  const session = readStudySession(studyId, condition);

  if (!session) {
    return;
  }

  const nextSession: RespondentSession = {
    ...session,
    pageDrafts: {
      ...session.pageDrafts,
      [`page-${pageNumber}`]: answers,
    },
  };

  writeJson(scopedSessionStorageKey(studyId, condition), nextSession);
}

export function updateStudyCurrentPage(
  studyId: StudyId,
  condition: Condition,
  pageNumber: number,
) {
  const session = readStudySession(studyId, condition);

  if (!session) {
    return;
  }

  writeJson(scopedSessionStorageKey(studyId, condition), {
    ...session,
    currentPage: pageNumber,
  } satisfies RespondentSession);
}

export function markStudyCompleted(
  studyId: StudyId,
  condition: Condition,
  finishedAt: string,
  pageNumber: number,
) {
  const session = readStudySession(studyId, condition);

  if (!session) {
    return;
  }

  writeJson(scopedSessionStorageKey(studyId, condition), {
    ...session,
    currentPage: pageNumber,
    completedAt: finishedAt,
  } satisfies RespondentSession);
}

export function saveStudyPageSubmission(
  studyId: StudyId,
  condition: Condition,
  submission: StoredPageSubmission,
) {
  const session = readStudySession(studyId, condition);

  if (!session) {
    return;
  }

  writeJson(scopedSessionStorageKey(studyId, condition), {
    ...session,
    pageDrafts: {
      ...session.pageDrafts,
      [`page-${submission.page_number}`]: submission.answers,
    },
    pageSubmissions: {
      ...session.pageSubmissions,
      [`page-${submission.page_number}`]: submission,
    },
  } satisfies RespondentSession);
}

export function saveFirebaseBackupReceipt(
  studyId: StudyId,
  condition: Condition,
  receipt: FirebaseBackupReceipt,
) {
  const session = readStudySession(studyId, condition);

  if (!session) {
    return;
  }

  writeJson(scopedSessionStorageKey(studyId, condition), {
    ...session,
    firebaseBackup: receipt,
  } satisfies RespondentSession);
}

function upsertBy<T>(
  key: string,
  nextValue: T,
  matcher: (value: T) => boolean,
) {
  const existing = readJson<T[]>(key, []);
  const nextItems = [...existing];
  const index = nextItems.findIndex(matcher);

  if (index >= 0) {
    nextItems[index] = nextValue;
  } else {
    nextItems.push(nextValue);
  }

  writeJson(key, nextItems);
}

function appendValue<T>(key: string, nextValue: T) {
  const existing = readJson<T[]>(key, []);
  writeJson(key, [nextValue, ...existing]);
}

export function cacheRespondentStart(payload: RespondentStartPayload) {
  upsertBy(
    RESPONDENT_CACHE_KEY,
    payload,
    (item) =>
      (item as RespondentStartPayload).respondent_id === payload.respondent_id &&
      (item as RespondentStartPayload).study_id === payload.study_id,
  );
}

export function cachePageEvent(payload: PageEventPayload) {
  appendValue(PAGE_EVENT_CACHE_KEY, payload);
}

export function cacheFinish(payload: RespondentFinishPayload) {
  appendValue(FINISH_CACHE_KEY, payload);
  const respondents = readJson<RespondentStartPayload[]>(RESPONDENT_CACHE_KEY, []);
  const existing = respondents.find(
    (item) =>
      item.respondent_id === payload.respondent_id &&
      item.study_id === payload.study_id,
  );

  cacheRespondentStart({
    respondent_id: payload.respondent_id,
    study_id: payload.study_id,
    condition: payload.condition,
    started_at: existing?.started_at ?? payload.finished_at,
    status: "in_progress",
  });
}

export function readBrowserDashboardDataset(): DashboardDataset {
  if (!isBrowser()) {
    return {
      respondents: [],
      pageEvents: [],
      finishes: [],
      storageMode: "mock",
      notices: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const respondentsRaw = window.localStorage.getItem(RESPONDENT_CACHE_KEY);
  const pageEventsRaw = window.localStorage.getItem(PAGE_EVENT_CACHE_KEY);
  const finishesRaw = window.localStorage.getItem(FINISH_CACHE_KEY);
  const signature = `${respondentsRaw ?? "null"}::${pageEventsRaw ?? "null"}::${finishesRaw ?? "null"}`;

  if (dashboardDatasetCache?.signature === signature) {
    return dashboardDatasetCache.value;
  }

  const value = mergeDashboardDatasets({
    respondents: readJson(RESPONDENT_CACHE_KEY, []),
    pageEvents: readJson(PAGE_EVENT_CACHE_KEY, []),
    finishes: readJson(FINISH_CACHE_KEY, []),
    storageMode: "mock",
    notices: [
      "Browser cache merged. This view includes any submissions captured in localStorage on the current device.",
    ],
    updatedAt: new Date().toISOString(),
  });

  dashboardDatasetCache = {
    signature,
    value,
  };

  return value;
}
