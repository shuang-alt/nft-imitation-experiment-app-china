import { notFound } from "next/navigation";

import { StudyRunner } from "@/components/study-runner";
import { getStudyMetadata, isStudyId } from "@/lib/experiments";
import type { Condition, StudySessionBootstrap } from "@/lib/types";

type StudyPageProps = {
  params: Promise<{
    studyId: string;
    pageNumber: string;
  }>;
  searchParams: Promise<{
    respondent_id?: string | string[];
    condition?: string | string[];
    started_at?: string | string[];
    reset?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isCondition(value: string | undefined): value is Condition {
  return value === "control" || value === "treatment";
}

export default async function StudyPage({ params, searchParams }: StudyPageProps) {
  const { studyId, pageNumber } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isStudyId(studyId)) {
    notFound();
  }

  const currentPage = Number(pageNumber);
  const totalPages = getStudyMetadata(studyId).totalPages;

  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) {
    notFound();
  }

  const respondentId = firstParam(resolvedSearchParams.respondent_id)?.trim();
  const condition = firstParam(resolvedSearchParams.condition);
  const startedAt = firstParam(resolvedSearchParams.started_at);
  const reset = firstParam(resolvedSearchParams.reset);

  const bootstrap: StudySessionBootstrap | undefined =
    respondentId && isCondition(condition)
      ? {
          respondentId,
          condition,
          startedAt,
          currentPage,
          reset: reset === "1" || reset === "true",
        }
      : undefined;

  return (
    <StudyRunner
      studyId={studyId}
      pageNumber={currentPage}
      bootstrap={bootstrap}
    />
  );
}
