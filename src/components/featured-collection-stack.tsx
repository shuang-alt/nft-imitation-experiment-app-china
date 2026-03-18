import Image from "next/image";

import type { CollectionRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type FeaturedCollectionStackProps = {
  collections: CollectionRecord[];
  className?: string;
};

export function FeaturedCollectionStack({
  collections,
  className,
}: FeaturedCollectionStackProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {collections.map((collection) => (
        <article
          key={collection.key}
          className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 rounded-[30px] border border-white/85 bg-white/92 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:grid-cols-[96px_minmax(0,1fr)] md:p-5"
        >
          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-slate-100 bg-slate-100">
            <Image
              src={collection.imagePaths[0]}
              alt={`${collection.name} cover`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 font-display text-[1.55rem] leading-[1.05] text-pretty text-slate-950 md:text-[1.75rem]">
                {collection.name}
              </h2>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {collection.floorPrice}
              </span>
            </div>

            <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <p className="min-w-0 break-words text-pretty">{collection.creator}</p>
              <p className="text-left sm:text-right">{collection.createdDate}</p>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-6 text-pretty text-slate-600">
              {collection.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
