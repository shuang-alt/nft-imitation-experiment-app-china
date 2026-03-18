import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

import { CollectionCard } from "@/components/collection-card";
import { getStudyEntryCards } from "@/lib/experiments";

export default function HomePage() {
  const entryCards = getStudyEntryCards();
  const featuredCollections = entryCards
    .flatMap((entry) => entry.previewCollections)
    .filter(
      (collection, index, items) =>
        items.findIndex((item) => item.key === collection.key) === index,
    );

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[42px] border border-white/70 bg-white/84 shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-12 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-7">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                NFT Marketplace Browsing Study
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl leading-tight text-slate-950 md:text-[4.2rem] md:leading-[1.02]">
                  Choose one fixed experiment entry.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  Four independent paths are available below.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {entryCards.map((entry) => (
                  <Link
                    key={`${entry.studyId}-${entry.condition}`}
                    href={entry.entryPath}
                    className="group rounded-[30px] border border-slate-100 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {entry.study.shortLabel}
                      </span>
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                        {entry.conditionLabel}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl text-slate-950">
                      {entry.study.fullTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Start {entry.study.shortLabel} / {entry.conditionLabel}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      Open entry
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-6 py-3 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                >
                  Admin Preview
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative rounded-[36px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.9))] p-6">
              <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Experimental Collections
              </div>
              <div className="grid gap-4 pt-8 sm:grid-cols-2">
                {featuredCollections.map((collection) => (
                  <div
                    key={collection.key}
                    className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl text-slate-950">
                          {collection.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {collection.creator} · {collection.createdDate}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {collection.floorPrice}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {collection.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Marketplace Preview Grid
            </p>
            <h2 className="mt-2 font-display text-3xl text-slate-950 md:text-4xl">
              Unified collection cards
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredCollections.map((collection) => (
              <CollectionCard key={collection.key} collection={collection} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
