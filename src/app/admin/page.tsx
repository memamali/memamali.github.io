"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useConfig } from "@/hooks/useConfig";
import { DEFAULT_CONFIG, DEFAULT_SHOWS } from "@/lib/defaults";
import AdminLogin from "@/components/admin/AdminLogin";
import ResponsesTable from "@/components/admin/ResponsesTable";
import ShowsSetup from "@/components/admin/ShowsSetup";
import DoorControl from "@/components/admin/DoorControl";
import ModeControl from "@/components/admin/ModeControl";
import ContentEditor from "@/components/admin/ContentEditor";
import NewShowControl from "@/components/admin/NewShowControl";

type Tab = "responses" | "shows" | "door" | "mode" | "content" | "newshow";

const TABS: { id: Tab; label: string }[] = [
  { id: "responses", label: "الردود" },
  { id: "shows", label: "العروض" },
  { id: "door", label: "التحكم بالباب" },
  { id: "mode", label: "وضع الموقع" },
  { id: "content", label: "المحتوى" },
  { id: "newshow", label: "بدء عرض جديد" },
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("responses");
  const { exists, loading: cfgLoading } = useConfig();

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
      }),
    [],
  );

  if (authLoading) return <Center text="جارٍ التحميل…" />;
  if (!user) return <AdminLogin />;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-black text-white">لوحة الإدارة — أوتاد</h1>
        <button
          onClick={() => signOut(auth)}
          className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition hover:text-white"
        >
          خروج
        </button>
      </header>

      {cfgLoading ? (
        <p className="mt-8 text-[var(--color-muted)]">جارٍ التحميل…</p>
      ) : !exists ? (
        <InitScreen />
      ) : (
        <>
          <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition ${
                  tab === t.id
                    ? "border-[var(--color-rust)] text-white"
                    : "border-transparent text-[var(--color-muted)] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <section className="mt-6">
            {tab === "responses" && <ResponsesTable />}
            {tab === "shows" && <ShowsSetup />}
            {tab === "door" && <DoorControl />}
            {tab === "mode" && <ModeControl />}
            {tab === "content" && <ContentEditor />}
            {tab === "newshow" && <NewShowControl />}
          </section>
        </>
      )}
    </main>
  );
}

function InitScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initialize() {
    setBusy(true);
    setError(null);
    try {
      await setDoc(doc(db, "config", "main"), DEFAULT_CONFIG);
      const snap = await getDocs(collection(db, "shows"));
      if (snap.empty) {
        await Promise.all(
          DEFAULT_SHOWS.map((s) =>
            addDoc(collection(db, "shows"), { ...s, seatsRemaining: s.capacity }),
          ),
        );
      }
      // useConfig is realtime — the dashboard appears once config exists.
    } catch {
      setError("تعذّرت التهيئة. تأكد من قواعد Firestore والاتصال.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
      <h2 className="text-lg font-bold text-white">تهيئة الإعدادات</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        لم تتم التهيئة بعد. اضغط للزر أدناه لإنشاء الإعدادات الافتراضية و٣ عروض
        (سعة ١٦٥ لكل عرض). يمكنك تعديل كل شيء لاحقاً.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-[var(--color-full)]">{error}</p>
      ) : null}
      <button
        onClick={initialize}
        disabled={busy}
        className="mt-5 rounded-xl bg-[var(--color-rust)] px-6 py-3 font-bold text-white transition hover:bg-[var(--color-rust-hover)] disabled:opacity-60"
      >
        {busy ? "جارٍ التهيئة…" : "تهيئة الآن"}
      </button>
    </div>
  );
}

function Center({ text }: { text: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-4">
      <p className="text-[var(--color-muted)]">{text}</p>
    </main>
  );
}
