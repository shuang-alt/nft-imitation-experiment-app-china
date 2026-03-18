import { notFound } from "next/navigation";

import { StudyRunner } from "@/components/study-runner";
import { getStudyMetadata, isStudyId } from "@/lib/experiments";

type StudyPageProps = {
  params: Promise<{
    studyId: string;
    pageNumber: string;
  }>;
};

export default async function StudyPage({ params }: StudyPageProps) {
  const { studyId, pageNumber } = await params;

  if (!isStudyId(studyId)) {
    notFound();
  }

  const currentPage = Number(pageNumber);
  const totalPages = getStudyMetadata(studyId).totalPages;

  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) {
    notFound();
  }

  return <StudyRunner studyId={studyId} pageNumber={currentPage} />;
}
