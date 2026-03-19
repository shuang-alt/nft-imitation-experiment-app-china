import { CalendarDays, Gem, Sparkles, UserRound } from "lucide-react";

import type { CollectionRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CollectionArt } from "./collection-art";

type CollectionCardProps = {
  collection: CollectionRecord;
  label?: string;
  nameOverride?: string;
  density?: "default" | "compact";
  layout?: "default" | "showcase";
  imageCount?: number;
  metadataSize?: "default" | "prominent";
  creatorValueClassName?: string;
  className?: string;
};

export function CollectionCard({
  collection,
  label,
  nameOverride,
  density = "default",
  layout = "default",
  imageCount,
  metadataSize = "default",
  creatorValueClassName,
  className,
}: CollectionCardProps) {
  const compact = density === "compact";
  const showcase = layout === "showcase";
  const prominentMetadata = metadataSize === "prominent";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[32px] border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_28px_90px_rgba(15,23,42,0.12)]",
        compact ? "p-4" : "p-5 md:p-6",
        showcase && "h-full bg-white/92 shadow-[0_22px_70px_rgba(15,23,42,0.1)]",
        className,
      )}
    >
      <div
        className={cn(
          "space-y-4",
          compact && "space-y-3",
          showcase && "flex h-full flex-col space-y-5",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className={cn("min-w-0 flex-1 space-y-2", showcase && "min-h-[4.8rem]")}>
            {label ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {label}
              </span>
            ) : null}
            <div>
              <h3
                className={cn(
                  "break-words font-display text-pretty text-slate-950",
                  compact ? "text-xl leading-7" : "text-2xl leading-8 md:text-[1.85rem]",
                  showcase && "line-clamp-2 text-[1.7rem] leading-[1.08] md:text-[1.85rem]",
                )}
              >
                {nameOverride ?? collection.name}
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Marketplace Preview
          </span>
        </div>

        <CollectionArt
          name={nameOverride ?? collection.name}
          imagePaths={collection.imagePaths}
          imageCount={imageCount}
          className={cn(showcase && "gap-2.5")}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-full rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div
              className={cn(
                "flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-500",
                prominentMetadata ? "text-[0.82rem]" : "text-xs",
              )}
            >
              <UserRound className="h-4 w-4" />
              Creator
            </div>
            <p
              className={cn(
                "mt-2 break-words font-semibold leading-6 text-pretty text-slate-900",
                prominentMetadata ? "text-base leading-7 md:text-lg" : "text-sm",
                showcase && "line-clamp-2 min-h-[3rem]",
                creatorValueClassName,
              )}
            >
              {collection.creator}
            </p>
          </div>
          <div className="h-full rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div
              className={cn(
                "flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-500",
                prominentMetadata ? "text-[0.82rem]" : "text-xs",
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Created Date
            </div>
            <p
              className={cn(
                "mt-2 font-semibold leading-6 text-slate-900",
                prominentMetadata ? "text-base leading-7 md:text-lg" : "text-sm",
              )}
            >
              {collection.createdDate}
            </p>
          </div>
          <div className="h-full rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
            <div
              className={cn(
                "flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-500",
                prominentMetadata ? "text-[0.82rem]" : "text-xs",
              )}
            >
              <Gem className="h-4 w-4" />
              Floor Price
            </div>
            <p
              className={cn(
                "mt-2 font-semibold leading-6 text-slate-900",
                prominentMetadata ? "text-base leading-7 md:text-lg" : "text-sm",
              )}
            >
              {collection.floorPrice}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "rounded-[24px] border border-slate-100 bg-slate-50/70 p-4",
            showcase && "flex min-h-[8.9rem] flex-col",
          )}
        >
          <div
            className={cn(
              "font-semibold uppercase tracking-[0.18em] text-slate-500",
              prominentMetadata ? "text-[0.82rem]" : "text-xs",
            )}
          >
            Description
          </div>
          <p
            className={cn(
              "mt-2 text-pretty text-slate-700",
              prominentMetadata ? "text-base leading-8" : "text-sm leading-7",
              showcase && "line-clamp-3 leading-6",
            )}
          >
            {collection.description}
          </p>
        </div>
      </div>
    </article>
  );
}
