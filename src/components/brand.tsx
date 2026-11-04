import { cn } from "@/lib/utils";
import type { SeriesRow } from "@/lib/catalog";
import { statusLabel } from "@/lib/catalog";

/** Placeholder brand mark: mihrab arch containing an open glowing book. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-10 w-10", className)} aria-hidden>
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#F6D58A" />
          <stop offset="100%" stopColor="#D29229" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M8 60V30C8 15 20 4 32 4s24 11 24 26v30Z" fill="#00254C" stroke="#D29229" strokeWidth="3" />
      <circle cx="32" cy="40" r="18" fill="url(#glow)" />
      <path d="M14 46c6-3 12-3 18 1 6-4 12-4 18-1V34c-6-3-12-3-18 1-6-4-12-4-18-1Z" fill="#FFFFFF" stroke="#D29229" strokeWidth="2" />
      <path d="M32 35v12" stroke="#D29229" strokeWidth="2" />
      <path d="M32 12l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5Z" fill="#D29229" />
    </svg>
  );
}

export function Cover({ series, className }: { series: Pick<SeriesRow, "title" | "cover_url" | "cover_hue" | "genre" | "status" | "is_premium">; className?: string }) {
  if (series.cover_url) {
    return <img src={series.cover_url} alt={series.title} className={cn("aspect-[3/4] w-full rounded-2xl object-cover", className)} loading="lazy" />;
  }
  const h = series.cover_hue;
  return (
    <div
      className={cn("relative flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-2xl p-3 text-navy-foreground", className)}
      style={{ background: `linear-gradient(160deg, oklch(0.3 0.09 ${h + 255}), oklch(0.2 0.07 ${h + 255}))` }}
    >
      <svg viewBox="0 0 100 120" className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-4/5 w-4/5 opacity-30" aria-hidden>
        <path d="M10 120V55C10 25 30 8 50 8s40 17 40 47v65" fill="none" stroke="#D29229" strokeWidth="3" />
        <circle cx="50" cy="75" r="28" fill="#D29229" opacity="0.35" />
      </svg>
      <span className="relative self-start rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">{series.genre}</span>
      <div className="relative">
        <p className="font-display text-base leading-tight font-bold sm:text-lg">{series.title}</p>
        <p className="mt-1 text-[10px] tracking-wider uppercase opacity-80">Sekolah Kisah Anak</p>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", status === "Completed" ? "bg-success/15 text-success" : "bg-gold/20 text-navy")}>
      {statusLabel(status)}
    </span>
  );
}
