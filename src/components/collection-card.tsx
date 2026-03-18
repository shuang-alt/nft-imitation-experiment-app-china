import { CalendarDays, Gem, Sparkles, UserRound } from "lucide-react";

import type { CollectionRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CollectionArt } from "./collection-art";

type CollectionCardProps = {
  collection: CollectionRecord;
  label?: string;
  nameOverride?: string;
  density?: "default" | "compact";
};

export function CollectionCard({
  collection,
  label,
  nameOverride,
  density = "default",
}: CollectionCardProps) {
  const compact = density === "compact";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[32px] border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_28px_90px_rgba(15,23,42,0.12)]",
        compact ? "p-4" : "p-5 md:p-6",
      )}
    >
      <div className={cn("space-y-4", compact && "space-y-3")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {label ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {label}
              </span>
            ) : null}
            <div>
              <h3
                className={cn(
                  "font-display text-slate-950",
                  compact ? "text-xl leading-7" : "text-2xl leading-8 md:text-[1.85rem]",
                )}
              >
                {nameOverride ?? collection.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                {collection.themeTagline}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Marketplace Preview
          </span>
        </div>

        <CollectionArt variant={collection.artVariant} />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <UserRound className="h-4 w-4" />
              Creator
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{collection.creator}</p>
          </div>
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Created Date
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{collection.createdDate}</p>
          </div>
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Gem className="h-4 w-4" />
              Floor Price
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{collection.floorPrice}</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-700">{collection.description}</p>
        </div>
      </div>
    </article>
  );
}
