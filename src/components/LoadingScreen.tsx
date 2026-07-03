import { BrandHeader } from "./BrandHeader";

// Branded loading state: the logo renders crisply and instantly, with a pulsing
// skeleton of the registration card below it. Mirrors RegistrationForm's layout
// so the swap to the real form is seamless — no bare "please wait" moment.
export default function LoadingScreen() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <BrandHeader />

      <div className="mt-5 animate-pulse rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        {/* Description lines */}
        <div className="space-y-3 border-b border-[var(--color-line)] pb-5">
          <div className="mx-auto h-4 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-9 w-full rounded-lg bg-[var(--color-rust)]/25" />
        </div>

        {/* Form fields */}
        <div className="mt-5 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-24 rounded bg-white/10" />
              <div className="h-12 w-full rounded-xl bg-white/5" />
            </div>
          ))}
          <div className="h-12 w-full rounded-xl bg-[var(--color-rust)]/50" />
        </div>
      </div>
    </main>
  );
}
