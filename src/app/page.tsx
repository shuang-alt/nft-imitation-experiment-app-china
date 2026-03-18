import Link from "next/link";
import { ArrowRight, DatabaseZap, LayoutDashboard } from "lucide-react";

import { CollectionCard } from "@/components/collection-card";
import { getFeaturedCollections, studyMetadata } from "@/lib/experiments";

export default function HomePage() {
  const featuredCollections = getFeaturedCollections();

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[42px] border border-white/70 bg-white/82 shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-12 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-7">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Academic Research · NFT Marketplace Browsing Study
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-4xl leading-tight text-slate-950 md:text-[4.2rem] md:leading-[1.02]">
                  NFT imitation experiment platform built for realistic marketplace browsing.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  本站包含两个独立 study 入口，使用统一的 NFT marketplace 风格、随机分组逻辑、逐页保存接口和 mock/database 双模式数据层。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/study-1"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Study 1
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/study-2"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Start Study 2
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-6 py-3 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
                >
                  Admin Preview
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>

              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Study 1
                  </dt>
                  <dd className="mt-2 font-display text-2xl text-slate-950">
                    {studyMetadata.study1.fullTitle}
                  </dd>
                </div>
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Study 2
                  </dt>
                  <dd className="mt-2 font-display text-2xl text-slate-950">
                    {studyMetadata.study2.fullTitle}
                  </dd>
                </div>
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <DatabaseZap className="h-4 w-4" />
                    Data Mode
                  </dt>
                  <dd className="mt-2 text-sm leading-7 text-slate-600">
                    If database env placeholders stay empty, the app remains fully usable in mock mode and logs payloads locally.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative rounded-[36px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.9))] p-6">
              <div className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Experimental Collections
              </div>
              <div className="grid gap-4 pt-8">
                {featuredCollections.map((collection) => (
                  <div
                    key={collection.key}
                    className="rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Marketplace Preview Grid
              </p>
              <h2 className="mt-2 font-display text-3xl text-slate-950 md:text-4xl">
                Unified collection cards for experimental exposure
              </h2>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {featuredCollections.map((collection) => (
              <CollectionCard key={collection.key} collection={collection} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
