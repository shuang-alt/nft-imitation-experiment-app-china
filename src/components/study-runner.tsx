"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { ArrowRight, Clock3, Layers3, Shield, Sparkles } from "lucide-react";

import {
  cacheFinish,
  cachePageEvent,
  cacheRespondentStart,
  ensureStudySession,
  getStudySessionSnapshot,
  markStudyCompleted,
  readStudySession,
  saveStudyDraft,
  subscribeToStorage,
  updateStudyCurrentPage,
} from "@/lib/client-storage";
import {
  getCollectionRecord,
  getStudyMetadata,
  getStudyPages,
} from "@/lib/experiments";
import type {
  AnswerRecord,
  DemographicsPage,
  PersistResult,
  ResolvedStudyPage,
  StudyId,
} from "@/lib/types";
import { abbreviateRespondentId, cn } from "@/lib/utils";

import { CollectionCard } from "./collection-card";
import { LikertQuestionGroup } from "./likert-question-group";

type StudyRunnerProps = {
  studyId: StudyId;
  pageNumber: number;
};

function isPageComplete(page: ResolvedStudyPage, answers: AnswerRecord) {
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

export function StudyRunner({ studyId, pageNumber }: StudyRunnerProps) {
  const session = useSyncExternalStore(
    subscribeToStorage,
    () => getStudySessionSnapshot(studyId),
    () => null,
  );
  const pages = session ? getStudyPages(studyId, session.condition) : [];
  const page = session ? pages[pageNumber - 1] : null;

  useEffect(() => {
    const { session: ensuredSession, isNew } = ensureStudySession(studyId);
    updateStudyCurrentPage(studyId, pageNumber);

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
  }, [pageNumber, studyId]);

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
      page={page}
      pageNumber={pageNumber}
    />
  );
}

type StudyPageContentProps = {
  studyId: StudyId;
  pageNumber: number;
  page: ResolvedStudyPage;
  session: NonNullable<ReturnType<typeof getStudySessionSnapshot>>;
};

function StudyPageContent({
  studyId,
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

  useEffect(() => {
    saveStudyDraft(studyId, pageNumber, answers);
  }, [answers, pageNumber, studyId]);

  const progressPercent = Math.round((pageNumber / study.totalPages) * 100);

  async function handleNext() {
    if (!isPageComplete(page, answers)) {
      setErrorMessage("请完成本页所有必答项后再继续。");
      return;
    }

    setErrorMessage("");
    const submittedAt = new Date().toISOString();
    const currentSession = readStudySession(studyId);

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

        cacheFinish(finishPayload);
        markStudyCompleted(studyId, submittedAt, page.pageNumber);

        if (finishResult.mode === "mock") {
          console.info("[client-mock] respondent-finish", finishPayload);
        }

        startTransition(() => {
          router.push(`/thank-you/${studyId}`);
        });

        return;
      }

      startTransition(() => {
        router.push(`/study/${studyId}/page/${pageNumber + 1}`);
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
            <p key={paragraph} className="text-base leading-8 text-slate-700 md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      );
    }

    if (page.kind === "single-collection") {
      const collection = getCollectionRecord(page.collectionKey);

      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className="text-base leading-8 text-slate-700 md:text-lg">
                {line}
              </p>
            ))}
          </div>
          <CollectionCard collection={collection} nameOverride={page.collectionNameOverride} />
          <div className="space-y-2">
            {page.footerLines.map((line) => (
              <p key={line} className="text-sm leading-7 text-slate-600">
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (page.kind === "dual-collection") {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className="text-base leading-8 text-slate-700 md:text-lg">
                {line}
              </p>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {page.collectionKeys.map((collectionKey, index) => (
              <CollectionCard
                key={`${collectionKey}-${index}`}
                collection={getCollectionRecord(collectionKey)}
                label={page.collectionLabels[index]}
              />
            ))}
          </div>
          <div className="space-y-2">
            {page.footerLines.map((line) => (
              <p key={line} className="text-sm leading-7 text-slate-600">
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (page.kind === "likert") {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {page.introLines.map((line) => (
              <p key={line} className="text-base leading-8 text-slate-700 md:text-lg">
                {line}
              </p>
            ))}
          </div>
          <LikertQuestionGroup
            items={page.items}
            answerKeys={page.answerKeys}
            values={answers}
            onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
            scaleLabel={page.scaleLabel}
          />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          {page.introLines.map((line) => (
            <p key={line} className="text-base leading-8 text-slate-700 md:text-lg">
              {line}
            </p>
          ))}
        </div>

        <LikertQuestionGroup
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
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[36px] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
            >
              VaultCanvas Lab
            </Link>
            <div>
              <h1 className="font-display text-3xl text-slate-950 md:text-[2.5rem]">
                {study.fullTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {study.shortLabel} · Page {pageNumber} / {study.totalPages}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Clock3 className="h-4 w-4" />
                Session
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {abbreviateRespondentId(session.respondentId)}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Layers3 className="h-4 w-4" />
                Progress
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {progressPercent}% complete
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Shield className="h-4 w-4" />
                Privacy
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Anonymous response
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[36px] border border-white/80 bg-white/82 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl md:p-8">
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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-500">
                每次点击“下一页”都会触发逐页保存接口，并记录 page metadata。
              </p>
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

          <aside className="space-y-5">
            <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                Session Context
              </div>
              <h2 className="mt-3 font-display text-2xl text-slate-950">
                NFT marketplace browsing study
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                页面风格模拟 marketplace 浏览体验，受试者在本地会话内会保持同一实验条件，不会因刷新页面而变化。
              </p>
            </section>

            {page.sidebarCollectionKeys?.map((collectionKey, index) => (
              <CollectionCard
                key={`${collectionKey}-${index}`}
                collection={getCollectionRecord(collectionKey)}
                density="compact"
              />
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
