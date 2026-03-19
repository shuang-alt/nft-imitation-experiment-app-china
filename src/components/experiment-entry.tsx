"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  buildStudyPagePath,
  getConditionLabel,
  getEntryPreviewCollections,
  getStudyMetadata,
} from "@/lib/experiments";
import type { Condition, StudyId } from "@/lib/types";

import { CollectionCard } from "./collection-card";
import { FeaturedCollectionStack } from "./featured-collection-stack";

type ExperimentEntryProps = {
  studyId: StudyId;
  condition: Condition;
};

export function ExperimentEntry({ studyId, condition }: ExperimentEntryProps) {
  const study = getStudyMetadata(studyId);
  const conditionLabel = getConditionLabel(condition);
  const previewCollections = getEntryPreviewCollections(studyId, condition);

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[42px] border border-white/70 bg-white/84 shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid gap-10 px-6 py-8 md:px-10 md:py-12 xl:grid-cols-[minmax(0,1.03fr)_minmax(22rem,0.95fr)]">
            <div className="flex h-full flex-col gap-7">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  NFT Marketplace Browsing Study
                </span>
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                  {study.shortLabel} / {conditionLabel}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl leading-tight text-slate-950 md:text-[4.1rem] md:leading-[1.02]">
                  {study.fullTitle}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  {study.shortLabel} / {conditionLabel}
                </p>
              </div>

              <div className="mt-auto space-y-7">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={buildStudyPagePath(studyId, condition, 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Start {study.shortLabel} / {conditionLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Study
                    </dt>
                    <dd className="mt-2 font-display text-2xl text-slate-950">
                      {study.shortLabel}
                    </dd>
                  </div>
                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Condition
                    </dt>
                    <dd className="mt-2 font-display text-2xl text-slate-950">
                      {conditionLabel}
                    </dd>
                  </div>
                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Pages
                    </dt>
                    <dd className="mt-2 font-display text-2xl text-slate-950">
                      {study.totalPages}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="relative rounded-[36px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.88))] p-6 md:p-7">
              <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Featured Collections
              </div>
              <FeaturedCollectionStack collections={previewCollections} className="pt-8" />
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Collection Preview
            </p>
            <h2 className="mt-2 font-display text-3xl text-slate-950 md:text-4xl">
              {study.shortLabel} / {conditionLabel}
            </h2>
          </div>

          <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
            {previewCollections.map((collection) => (
              <CollectionCard
                key={collection.key}
                collection={collection}
                layout="showcase"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
