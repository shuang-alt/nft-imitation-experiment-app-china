import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

import { getStudyMetadata, isStudyId } from "@/lib/experiments";

type ThankYouPageProps = {
  params: Promise<{
    studyId: string;
  }>;
};

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { studyId } = await params;

  if (!isStudyId(studyId)) {
    notFound();
  }

  const study = getStudyMetadata(studyId);

  return (
    <main className="flex min-h-screen items-center px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl rounded-[40px] border border-white/80 bg-white/85 p-8 text-center shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Submission Completed
        </p>
        <h1 className="mt-3 font-display text-4xl text-slate-950 md:text-5xl">
          Thank you
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          您已完成 {study.shortLabel}（{study.fullTitle}）的全部页面。系统已触发逐页保存与最终完成接口；若数据库占位符仍为空，则本次数据已写入 mock/local fallback 并输出到日志。
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Return Home
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Open Admin Preview
          </Link>
        </div>
      </div>
    </main>
  );
}
