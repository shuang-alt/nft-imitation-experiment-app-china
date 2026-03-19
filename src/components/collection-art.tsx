import Image from "next/image";

import { cn } from "@/lib/utils";

type CollectionArtProps = {
  name: string;
  imagePaths: string[];
  imageCount?: number;
  className?: string;
};

export function CollectionArt({
  name,
  imagePaths,
  imageCount,
  className,
}: CollectionArtProps) {
  const visibleImagePaths = imageCount ? imagePaths.slice(0, imageCount) : imagePaths;

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {visibleImagePaths.map((imagePath, index) => (
        <div
          key={`${name}-${index + 1}`}
          className="relative aspect-square overflow-hidden rounded-[22px] border border-white/70 bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        >
          <Image
            src={imagePath}
            alt={`${name} artwork ${index + 1}`}
            fill
            sizes="(max-width: 768px) 33vw, 180px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
