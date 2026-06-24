"use client";

import { useShows } from "@/hooks/useShows";
import { seatStatus, toArabicDigits, formatTimeOnly } from "@/lib/utils";
import type { Config, Show } from "@/lib/types";
import { BrandHeader } from "./BrandHeader";

const STATUS_TEXT: Record<string, string> = {
  ok: "text-[var(--color-ok)]",
  warn: "text-[var(--color-warn)]",
  full: "text-[var(--color-full)]",
};
const STATUS_BG: Record<string, string> = {
  ok: "bg-[var(--color-ok)]",
  warn: "bg-[var(--color-warn)]",
  full: "bg-[var(--color-full)]",
};

export default function SeatBoard({ config }: { config: Config }) {
  const { shows, loading, lastUpdated, fromCache } = useShows();
  const current = shows.find((s) => s.id === config.currentShowId) ?? null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-8">
      <BrandHeader subtitle="المقاعد المتبقّية" />

      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[var(--color-faint)]">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            fromCache ? "bg-[var(--color-warn)]" : "bg-[var(--color-ok)]"
          }`}
        />
        <span>
          {fromCache ? "غير متصل — آخر تحديث" : "مباشر — آخر تحديث"}{" "}
          {formatTimeOnly(lastUpdated)}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {loading ? (
          <p className="text-[var(--color-muted)]">جارٍ التحميل…</p>
        ) : current ? (
          <Hero show={current} />
        ) : (
          <p className="text-center text-lg text-[var(--color-muted)]">
            سيبدأ العرض قريباً بإذن الله.
          </p>
        )}
      </div>
    </main>
  );
}

function Hero({ show }: { show: Show }) {
  const st = seatStatus(show.seatsRemaining, show.capacity);
  const pct =
    show.capacity > 0
      ? Math.max(0, Math.min(100, (show.seatsRemaining / show.capacity) * 100))
      : 0;

  return (
    <section className="w-full rounded-3xl border-2 border-[var(--color-rust)] bg-[var(--color-surface)] p-8 text-center shadow-2xl shadow-black/30">
      <span className="inline-block rounded-full bg-[var(--color-rust)] px-4 py-1.5 text-sm font-bold text-white">
        العرض الحالي
      </span>

      <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">{show.name}</h2>

      <div className="my-6">
        <span
          key={show.seatsRemaining}
          className={`animate-count-pop block text-[5.5rem] font-black leading-none tabular-nums sm:text-[7rem] ${STATUS_TEXT[st.key]}`}
        >
          {toArabicDigits(show.seatsRemaining)}
        </span>
        <p className="mt-3 text-[var(--color-muted)]">
          مقعداً متبقّياً من {toArabicDigits(show.capacity)}
        </p>
      </div>

      <div className="mx-auto h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${STATUS_BG[st.key]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className={`mt-4 inline-block rounded-full px-4 py-1.5 text-base font-bold ${STATUS_TEXT[st.key]}`}
        style={{ backgroundColor: "color-mix(in srgb, currentColor 15%, transparent)" }}
      >
        {st.label}
      </div>
    </section>
  );
}
