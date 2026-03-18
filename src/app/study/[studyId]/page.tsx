import { notFound, redirect } from "next/navigation";

import { isStudyId } from "@/lib/experiments";

type StudyEntryPageProps = {
  params: Promise<{
    studyId: string;
  }>;
};

export default async function StudyEntryPage({ params }: StudyEntryPageProps) {
  const { studyId } = await params;

  if (!isStudyId(studyId)) {
    notFound();
  }

  redirect(`/study/${studyId}/page/1`);
}
