import type { CollectionArtVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

type CollectionArtProps = {
  variant: CollectionArtVariant;
  className?: string;
};

function pixelPalette(variant: Extract<CollectionArtVariant, "pixelPaws" | "pixelPawsX">, index: number) {
  const palettes =
    variant === "pixelPaws"
      ? [
          ["#f59e0b", "#fde68a", "#1d4ed8", "#0f172a", "#fef3c7"],
          ["#fb7185", "#fecdd3", "#2563eb", "#111827", "#fdf2f8"],
          ["#22c55e", "#dcfce7", "#0f766e", "#111827", "#f0fdf4"],
          ["#8b5cf6", "#ddd6fe", "#0ea5e9", "#111827", "#eef2ff"],
        ]
      : [
          ["#14b8a6", "#99f6e4", "#312e81", "#111827", "#ecfeff"],
          ["#38bdf8", "#bae6fd", "#4338ca", "#0f172a", "#e0f2fe"],
          ["#818cf8", "#e0e7ff", "#0f766e", "#0f172a", "#eef2ff"],
          ["#f59e0b", "#fde68a", "#2563eb", "#111827", "#fffbeb"],
        ];

  return palettes[index % palettes.length];
}

function PixelCatGlyph({
  variant,
  index,
}: {
  variant: Extract<CollectionArtVariant, "pixelPaws" | "pixelPawsX">;
  index: number;
}) {
  const [fur, highlight, accent, outline, whisker] = pixelPalette(variant, index);

  return (
    <svg viewBox="0 0 160 160" className="h-full w-full">
      <rect x="28" y="30" width="18" height="18" fill={fur} />
      <rect x="42" y="18" width="22" height="22" fill={fur} />
      <rect x="96" y="18" width="22" height="22" fill={fur} />
      <rect x="114" y="30" width="18" height="18" fill={fur} />
      <rect x="34" y="42" width="92" height="76" rx="18" fill={fur} />
      <rect x="44" y="54" width="26" height="18" rx="6" fill={highlight} />
      <rect x="90" y="54" width="26" height="18" rx="6" fill={highlight} />
      <rect x="54" y="60" width="10" height="10" rx="3" fill={outline} />
      <rect x="96" y="60" width="10" height="10" rx="3" fill={outline} />
      <rect x="72" y="82" width="16" height="10" rx="4" fill={accent} />
      <rect x="64" y="94" width="32" height="8" rx="4" fill={outline} opacity="0.8" />
      <rect x="48" y="96" width="16" height="3" rx="2" fill={whisker} />
      <rect x="96" y="96" width="16" height="3" rx="2" fill={whisker} />
      <rect x="46" y="102" width="18" height="3" rx="2" fill={whisker} />
      <rect x="96" y="102" width="18" height="3" rx="2" fill={whisker} />
      <rect x="38" y="122" width="84" height="10" rx="5" fill={outline} opacity="0.22" />
    </svg>
  );
}

function WhaleGlyph({ index }: { index: number }) {
  const palettes = [
    ["#082f49", "#0ea5e9", "#67e8f9", "#dbeafe"],
    ["#0f172a", "#38bdf8", "#a5f3fc", "#e0f2fe"],
    ["#164e63", "#06b6d4", "#c4b5fd", "#ecfeff"],
    ["#111827", "#22d3ee", "#93c5fd", "#f8fafc"],
  ];
  const [body, accent, glow, bubble] = palettes[index % palettes.length];

  return (
    <svg viewBox="0 0 160 160" className="h-full w-full">
      <circle cx="122" cy="34" r="12" fill={bubble} opacity="0.55" />
      <circle cx="104" cy="24" r="6" fill={bubble} opacity="0.45" />
      <circle cx="136" cy="56" r="4" fill={bubble} opacity="0.5" />
      <path
        d="M24 94C24 66 51 44 83 44C102 44 119 52 130 66C132 64 136 58 144 54C141 63 142 69 145 75C138 76 134 74 129 71C128 98 108 116 77 116C49 116 24 108 24 94Z"
        fill={body}
      />
      <path
        d="M84 62C101 62 116 69 122 83C111 80 104 79 92 80C73 81 58 87 44 97C44 75 60 62 84 62Z"
        fill={accent}
        opacity="0.88"
      />
      <path
        d="M129 69C136 71 141 72 146 70C143 79 143 87 147 95C140 92 135 89 130 84"
        fill={glow}
        opacity="0.9"
      />
      <circle cx="98" cy="78" r="4" fill="#f8fafc" opacity="0.92" />
      <circle cx="100" cy="78" r="1.2" fill="#0f172a" />
      <path
        d="M50 112C63 118 78 121 91 121C104 121 117 117 125 110"
        fill="none"
        stroke={glow}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M34 112C40 119 50 126 64 130"
        fill="none"
        stroke={bubble}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

function ArtworkTile({
  variant,
  index,
  compact,
}: {
  variant: CollectionArtVariant;
  index: number;
  compact?: boolean;
}) {
  const backgrounds =
    variant === "pixelPaws"
      ? [
          "linear-gradient(135deg, #fff7ed 0%, #fee2e2 45%, #dbeafe 100%)",
          "linear-gradient(135deg, #fef3c7 0%, #ffe4e6 45%, #e0f2fe 100%)",
          "linear-gradient(135deg, #dcfce7 0%, #ecfccb 45%, #e0e7ff 100%)",
          "linear-gradient(135deg, #ede9fe 0%, #fde68a 45%, #dbeafe 100%)",
        ]
      : variant === "pixelPawsX"
        ? [
            "linear-gradient(135deg, #ecfeff 0%, #dbeafe 45%, #ede9fe 100%)",
            "linear-gradient(135deg, #cffafe 0%, #e0f2fe 45%, #fef3c7 100%)",
            "linear-gradient(135deg, #e0e7ff 0%, #ccfbf1 45%, #f8fafc 100%)",
            "linear-gradient(135deg, #fffbeb 0%, #dbeafe 45%, #ccfbf1 100%)",
          ]
        : [
            "linear-gradient(135deg, #082f49 0%, #0f172a 55%, #164e63 100%)",
            "linear-gradient(135deg, #0f172a 0%, #0c4a6e 55%, #06b6d4 100%)",
            "linear-gradient(135deg, #111827 0%, #1e3a8a 50%, #22d3ee 100%)",
            "linear-gradient(135deg, #164e63 0%, #082f49 55%, #38bdf8 100%)",
          ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/40 shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
        compact ? "min-h-[128px]" : "min-h-[164px]",
      )}
      style={{ background: backgrounds[index % backgrounds.length] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_45%),linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative h-full w-full p-4">
        {variant === "cyberWhales" ? (
          <WhaleGlyph index={index} />
        ) : (
          <PixelCatGlyph variant={variant} index={index} />
        )}
      </div>
    </div>
  );
}

export function CollectionArt({ variant, className }: CollectionArtProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-[1.35fr_0.9fr]", className)}>
      <ArtworkTile variant={variant} index={0} />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <ArtworkTile key={`${variant}-${index + 1}`} variant={variant} index={index + 1} compact />
        ))}
      </div>
    </div>
  );
}
