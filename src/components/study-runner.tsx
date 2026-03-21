"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  bootstrapStudySession,
  cacheFinish,
  cachePageEvent,
  cacheRespondentStart,
  ensureStudySession,
  getStudySessionSnapshot,
  markStudyCompleted,
  readStudySession,
  saveStudyDraft,
  saveFirebaseBackupReceipt,
  saveStudyPageSubmission,
  subscribeToStorage,
  updateStudyCurrentPage,
} from "@/lib/client-storage";
import {
  buildStudyEntryPath,
  buildStudyPagePath,
  buildThankYouPath,
  getCollectionRecord,
  getStudyMetadata,
  getStudyPages,
} from "@/lib/experiments";
import { backupCompletedSubmissionToFirebase } from "@/lib/firebase-backup";
import type {
  AnswerRecord,
  Condition,
  DemographicsPage,
  FinalSubmissionBackupPayload,
  PersistResult,
  ResolvedStudyPage,
  StoredPageSubmission,
  StudySessionBootstrap,
  StudyId,
} from "@/lib/types";
import { abbreviateRespondentId, cn } from "@/lib/utils";

import { CollectionCard } from "./collection-card";
import { LikertQuestionGroup } from "./likert-question-group";
import { MatrixStarQuestionGroup } from "./matrix-star-question-group";
import { SingleChoiceQuestion } from "./single-choice-question";

type StudyRunnerProps = {
  studyId: StudyId;
  condition: Condition;
  pageNumber: number;
  bootstrap?: StudySessionBootstrap;
};

function usesSingleColumnLayout(studyId: StudyId, pageNumber: number) {
  return studyId === "study1" || (studyId === "study2" && pageNumber >= 1 && pageNumber <= 4);
}

function usesImmersiveTypography(studyId: StudyId, pageNumber: number) {
  return (
    (studyId === "study1" && pageNumber >= 1 && pageNumber <= 3) ||
    (studyId === "study2" && pageNumber >= 1 && pageNumber <= 2)
  );
}

function isPageComplete(page: ResolvedStudyPage, answers: AnswerRecord) {
  if (page.kind === "single-choice") {
    return typeof answers[page.answerKey] === "string" && String(answers[page.answerKey]).length > 0;
  }

  if (page.kind === "likert" || page.kind === "demographics") {
    const likertComplete = page.answerKeys.every(
      (answerKey) => typeof answers[answerKey] === "number",
    );

    if (!likertComplete) {
      return false;
    }
  }

  if (page.kind === "demographics") {
    return page.demographicFields.every((field) => {
      const value = answers[field.key];
      if (field.kind === "number") {
        return typeof value === "number" && Number.isFinite(value);
      }

      return typeof value === "string" && value.length > 0;
    });
  }

  return true;
}

function parseAnswerValue(page: DemographicsPage, key: string, value: string) {
  const field = page.demographicFields.find((item) => item.key === key);

  if (field?.kind === "number") {
    return value ? Number(value) : null;
  }

  return value;
}

async function postPayload<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function createStoredPageSubmission(payload: {
  page_number: number;
  page_version: string;
  answers: AnswerRecord;
  entered_at: string;
  submitted_at: string;
  duration_ms: number;
}): StoredPageSubmission {
  return {
    page_number: payload.page_number,
    page_version: payload.page_version,
    answers: payload.answers,
    entered_at: payload.entered_at,
    submitted_at: payload.submitted_at,
    duration_ms: payload.duration_ms,
  };
}

function buildFinalSubmissionBackupPayload(params: {
  studyId: StudyId;
  condition: Condition;
  finishedAt: string;
  session: NonNullable<ReturnType<typeof readStudySession>>;
  currentPageSubmission: StoredPageSubmission;
}): FinalSubmissionBackupPayload {
  const pages = getStudyPages(params.studyId, params.condition);
  const pageVersions = Object.fromEntries(
    pages.map((studyPage) => [String(studyPage.pageNumber), studyPage.pageVersion]),
  );
  const pageSubmissions = Object.values(params.session.pageSubmissions).sort(
    (left, right) => left.page_number - right.page_number,
  );

  return {
    backup_version: "firebase-final-v1",
    respondent_id: params.session.respondentId,
    study_id: params.studyId,
    condition: params.condition,
    started_at: params.session.startedAt,
    finished_at: params.finishedAt,
    status: "completed",
    source: window.location.href,
    pathname: window.location.pathname,
    userAgent: window.navigator.userAgent,
    page_versions: pageVersions,
    page_drafts: {
      ...params.session.pageDrafts,
      [`page-${params.currentPageSubmission.page_number}`]:
        params.currentPageSubmission.answers,
    },
    page_submissions: pageSubmissions,
    current_page: params.currentPageSubmission,
    firebase_target_path: "/survey_submissions.json",
  };
}

export function StudyRunner({
  studyId,
  condition,
  pageNumber,
  bootstrap,
}: StudyRunnerProps) {
  const session = useSyncExternalStore(
    subscribeToStorage,
    () => getStudySessionSnapshot(studyId, condition),
    () => null,
  );
  const pages = session ? getStudyPages(studyId, condition) : [];
  const page = session ? pages[pageNumber - 1] : null;

  useEffect(() => {
    const { session: ensuredSession, isNew } = bootstrap
      ? bootstrapStudySession(studyId, condition, {
          ...bootstrap,
          currentPage: pageNumber,
        })
      : ensureStudySession(studyId, condition);
    updateStudyCurrentPage(studyId, condition, pageNumber);

    if (isNew) {
      const payload = {
        respondent_id: ensuredSession.respondentId,
        study_id: studyId,
        condition: ensuredSession.condition,
        started_at: ensuredSession.startedAt,
        status: "in_progress" as const,
      };

      cacheRespondentStart(payload);
      void postPayload<PersistResult>("/api/respondents/start", payload)
        .then((result) => {
          if (result.mode === "mock") {
            console.info("[client-mock] respondent-start", payload);
          }
        })
        .catch((error) => {
          console.error("Failed to initialize respondent", error);
        });
    }
  }, [bootstrap, condition, pageNumber, studyId]);

  if (!session || !page) {
    return (
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-16">
        <div className="rounded-[32px] border border-white/80 bg-white/85 px-8 py-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-medium text-slate-500">Preparing study session...</p>
        </div>
      </div>
    );
  }

  return (
    <StudyPageContent
      key={`${studyId}-${pageNumber}-${session.respondentId}`}
      session={session}
      studyId={studyId}
      condition={condition}
      page={page}
      pageNumber={pageNumber}
    />
  );
}

type StudyPageContentProps = {
  studyId: StudyId;
  condition: Condition;
  pageNumber: number;
  page: ResolvedStudyPage;
  session: NonNullable<ReturnType<typeof getStudySessionSnapshot>>;
};

function StudyPageContent({
  studyId,
  condition,
  pageNumber,
  page,
  session,
}: StudyPageContentProps) {
  const router = useRouter();
  const study = getStudyMetadata(studyId);
  const [isPending, startTransition] = useTransition();
  const [enteredAt] = useState(() => new Date().toISOString());
  const [answers, setAnswers] = useState<AnswerRecord>(
    () => session.pageDrafts[`page-${pageNumber}`] ?? {},
  );
  const [errorMessage, setErrorMessage] = useState("");
  const useSingleColumnLayout = usesSingleColumnLayout(studyId, pageNumber);
  const useImmersiveText = usesImmersiveTypography(studyId, pageNumber);
  const useWideStudy2Showcase = studyId === "study2" && pageNumber === 2;
  const previousPath =
    pageNumber === 1
      ? buildStudyEntryPath(studyId, condition)
      : buildStudyPagePath(studyId, condition, pageNumber - 1);
  const paragraphClassName = cn(
    "text-base leading-8 text-slate-700 md:text-lg",
    useImmersiveText && "md:text-[1.1rem] md:leading-9",
  );

  useEffect(() => {
    saveStudyDraft(studyId, condition, pageNumber, answers);
  }, [answers, condition, pageNumber, studyId]);

  const progressPercent = Math.round((pageNumber / study.totalPages) * 100);

  async function handleNext() {
    if (!isPageComplete(page, answers)) {
      setErrorMessage("请完成本页所有必答项后再继续。");
      return;
    }

    setErrorMessage("");
    const submittedAt = new Date().toISOString();
    const currentSession = readStudySession(studyId, condition);

    if (!currentSession) {
      setErrorMessage("本地会话丢失，请返回首页重新开始。");
      return;
    }

    const payload = {
      respondent_id: currentSession.respondentId,
      study_id: studyId,
      condition: currentSession.condition,
      page_number: page.pageNumber,
      page_version: page.pageVersion,
      answers,
      entered_at: enteredAt,
      submitted_at: submittedAt,
      duration_ms: Math.max(
        0,
        new Date(submittedAt).getTime() - new Date(enteredAt).getTime(),
      ),
    };

    try {
      const saveResult = await postPayload<PersistResult>("/api/page-events", payload);
      cachePageEvent(payload);
      saveStudyPageSubmission(studyId, condition, createStoredPageSubmission(payload));

      if (saveResult.mode === "mock") {
        console.info("[client-mock] page-event", payload);
      }

      if (page.pageNumber === study.totalPages) {
        const finishPayload = {
          respondent_id: currentSession.respondentId,
          study_id: studyId,
          condition: currentSession.condition,
          finished_at: submittedAt,
          status: "completed" as const,
        };
        const finishResult = await postPayload<PersistResult>(
          "/api/respondents/finish",
          finishPayload,
        );

        if (finishResult.mode === "mock") {
          console.info("[client-mock] respondent-finish", finishPayload);
        }

        const latestSession = readStudySession(studyId, condition);

        if (!latestSession) {
          setErrorMessage("本地会话丢失，请返回首页重新开始。");
          return;
        }

        const currentPageSubmission = createStoredPageSubmission(payload);
        const finalBackupPayload = buildFinalSubmissionBackupPayload({
          studyId,
          condition,
          finishedAt: submittedAt,
          session: latestSession,
          currentPageSubmission,
        });

        try {
          const firebaseBackup = await backupCompletedSubmissionToFirebase(
            finalBackupPayload,
          );

          saveFirebaseBackupReceipt(studyId, condition, {
            key: firebaseBackup.key,
            backedAt: submittedAt,
            path: firebaseBackup.path,
          });
          cacheFinish(finishPayload);
          markStudyCompleted(studyId, condition, submittedAt, page.pageNumber);

          startTransition(() => {
            router.push(buildThankYouPath(studyId, condition));
          });
        } catch (backupError) {
          console.error("Failed to backup final submission to Firebase", backupError);
          setErrorMessage("最终提交失败，请重试。数据尚未完成备份。");
        }

        return;
      }

      startTransition(() => {
        router.push(buildStudyPagePath(studyId, condition, pageNumber + 1));
      });
    } catch (error) {
      console.error(error);
      setErrorMessage("保存失败，请稍后重试。");
    }
  }

  function renderMainContent() {
    if (page.kind === "intro") {
      return (
        <div className="space-y-5">
          {page.paragraphs.map((paragraph) => (
            <p key={paragraph} className={paragraphClassName}>
              {paragraph}
            </p>
          ))}
        </div>
      );
    }

    if (page.kind === "single-collection") {
      const collection = getCollectionRecord(page.collectionKey);
      const useBrowsePresentation = page.cardPresentation === "study1-browse";

      return (
        <div className={cn("space-y-6", useSingleColumnLayout && "space-y-7")}>
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className={paragraphClassName}>
                {line}
              </p>
            ))}
          </div>
          <div
            className={cn(
              useBrowsePresentation && "mx-auto w-full max-w-[56rem] md:w-[90%]",
            )}
          >
            <CollectionCard
              collection={collection}
              nameOverride={page.collectionNameOverride}
              imageCount={page.cardImageCount}
              metadataSize={page.metadataEmphasis ? "prominent" : "default"}
            />
          </div>
          <div className="space-y-2">
            {page.footerLines.map((line) => (
              <p
                key={line}
                className={cn(
                  "text-sm leading-7 text-slate-600",
                  useSingleColumnLayout && "text-base leading-8",
                )}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (page.kind === "dual-collection") {
      return (
        <div className={cn("space-y-6", useSingleColumnLayout && "space-y-7")}>
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className={paragraphClassName}>
                {line}
              </p>
            ))}
          </div>
          <div
            className={cn(
              "mx-auto w-full",
              useWideStudy2Showcase ? "max-w-[76rem]" : "max-w-[74rem]",
            )}
          >
            <div
              className={cn(
                "grid gap-5 xl:grid-cols-2",
                useSingleColumnLayout && "gap-6 lg:grid-cols-2",
              )}
            >
              {page.collectionKeys.map((collectionKey, index) => (
                <CollectionCard
                  key={`${collectionKey}-${index}`}
                  collection={getCollectionRecord(collectionKey)}
                  label={page.collectionLabels[index]}
                  imageCount={page.cardImageCount}
                  metadataSize={page.metadataEmphasis ? "prominent" : "default"}
                  creatorValueClassName={
                    studyId === "study2" && pageNumber === 2 && index === 0
                      ? "max-w-full overflow-hidden whitespace-nowrap [text-overflow:clip]"
                      : undefined
                  }
                  className="h-full"
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {page.footerLines.map((line) => (
              <p
                key={line}
                className={cn(
                  "text-sm leading-7 text-slate-600",
                  useSingleColumnLayout && "text-base leading-8",
                )}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (page.kind === "single-choice") {
      return (
        <div className="space-y-8">
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className={paragraphClassName}>
                {line}
              </p>
            ))}
          </div>

          <SingleChoiceQuestion
            question={page.question}
            answerKey={page.answerKey}
            options={page.options}
            values={answers}
            onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
          />
        </div>
      );
    }

    if (page.kind === "likert") {
      const QuestionGroup =
        page.questionStyle === "matrix-stars"
          ? MatrixStarQuestionGroup
          : LikertQuestionGroup;

      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className={paragraphClassName}>
                {line}
              </p>
            ))}
          </div>
          <QuestionGroup
            items={page.items}
            answerKeys={page.answerKeys}
            values={answers}
            onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
            scaleLabel={page.scaleLabel}
          />
        </div>
      );
    }

    const QuestionGroup =
      page.questionStyle === "matrix-stars"
        ? MatrixStarQuestionGroup
        : LikertQuestionGroup;

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          {page.introLines.map((line) => (
            <p key={line} className={paragraphClassName}>
              {line}
            </p>
          ))}
        </div>

        <QuestionGroup
          items={page.items}
          answerKeys={page.answerKeys}
          values={answers}
          onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
          scaleLabel={page.scaleLabel}
        />

        <section className="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <h2 className="font-display text-2xl text-slate-950">
            {page.demographicSectionTitle}
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {page.demographicFields.map((field) => (
              <div key={field.key} className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">
                  {field.label}
                </label>
                {field.kind === "number" ? (
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={
                      typeof answers[field.key] === "number"
                        ? (answers[field.key] as number)
                        : ""
                    }
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [field.key]: parseAnswerValue(page, field.key, event.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {field.options?.map((option) => (
                      <label
                        key={`${field.key}-${option}`}
                        className={cn(
                          "cursor-pointer rounded-2xl border px-4 py-3 text-sm font-medium transition",
                          answers[field.key] === option
                            ? "border-sky-500 bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.28)]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50",
                        )}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={field.key}
                          value={option}
                          checked={answers[field.key] === option}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [field.key]: option,
                            }))
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "grid gap-6",
            !useSingleColumnLayout &&
              "xl:grid-cols-[minmax(0,1.32fr)_minmax(20rem,0.78fr)]",
          )}
        >
          <section
            className={cn(
              "rounded-[36px] border border-white/80 bg-white/82 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-8",
              useSingleColumnLayout &&
                (useWideStudy2Showcase
                  ? "mx-auto w-full max-w-7xl px-6 py-7 md:px-8 md:py-9 xl:px-10"
                  : "mx-auto w-full max-w-5xl px-6 py-7 md:px-10 md:py-9"),
            )}
          >
            <div className="mb-8">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {renderMainContent()}

            {errorMessage ? (
              <div className="mt-6 rounded-[22px] border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div
              className={cn(
                "mt-8 flex justify-end",
                useSingleColumnLayout && "md:mt-10",
                previousPath && "justify-between gap-4",
              )}
            >
              {previousPath ? (
                <Link
                  href={previousPath}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一页
                </Link>
              ) : null}

              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pageNumber === study.totalPages ? "提交并完成" : "下一页"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {!useSingleColumnLayout ? (
            <aside className="space-y-5">
              {page.showStudySnapshot !== false ? (
                <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Study Snapshot
                  </div>
                  <h2 className="mt-3 font-display text-2xl text-slate-950">
                    {study.fullTitle}
                  </h2>
                  <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Respondent
                      </dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-900">
                        {abbreviateRespondentId(session.respondentId)}
                      </dd>
                    </div>
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Page
                      </dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-900">
                        {pageNumber} / {study.totalPages}
                      </dd>
                    </div>
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Progress
                      </dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-900">
                        {progressPercent}%
                      </dd>
                    </div>
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Privacy
                      </dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-900">
                        Anonymous
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {page.sidebarCollectionKeys?.map((collectionKey, index) => (
                <CollectionCard
                  key={`${collectionKey}-${index}`}
                  collection={getCollectionRecord(collectionKey)}
                  density="compact"
                  imageCount={page.sidebarImageCount}
                />
              ))}
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
