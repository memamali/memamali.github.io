"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useConfig } from "@/hooks/useConfig";
import { MEN_ONLY_MARKER } from "@/lib/defaults";

const inputCls =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-white outline-none transition focus:border-[var(--color-focus)]";

type Save = "idle" | "saving" | "saved" | "error";

export default function ContentEditor() {
  const { config, loading } = useConfig();
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [postSubmitMessage, setPostSubmitMessage] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [save, setSave] = useState<Save>("idle");

  // Seed the fields once from config, then leave them under user control.
  // React's recommended pattern for adjusting state from a prop is a guarded
  // set during render (not an effect) — it re-renders before committing.
  if (config && !initialized) {
    setEventName(config.eventName);
    setDescription(config.description);
    setPostSubmitMessage(config.postSubmitMessage);
    setInitialized(true);
  }

  if (loading || !config) {
    return <p className="text-[var(--color-muted)]">جارٍ التحميل…</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim()) return;
    setSave("saving");
    try {
      await updateDoc(doc(db, "config", "main"), {
        eventName: eventName.trim(),
        description: description.replace(/\r\n/g, "\n"),
        postSubmitMessage: postSubmitMessage.replace(/\r\n/g, "\n"),
      });
      setSave("saved");
    } catch {
      setSave("error");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
    >
      <div>
        <h3 className="text-base font-bold text-white">محتوى صفحة التسجيل</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          حدّث هذه النصوص لكل عرض جديد — تظهر مباشرة للزوّار.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[var(--color-muted)]">اسم الفعالية</span>
        <input
          value={eventName}
          onChange={(e) => {
            setEventName(e.target.value);
            setSave("idle");
          }}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[var(--color-muted)]">
          الوصف (التاريخ والمكان)
        </span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSave("idle");
          }}
          rows={6}
          className={inputCls}
        />
        <span className="mt-1.5 block text-xs text-[var(--color-faint)]">
          كل سطر يظهر منفصلاً. أي سطر يحتوي على «{MEN_ONLY_MARKER}» يظهر مميّزاً بإطار.
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[var(--color-muted)]">
          رسالة ما بعد التسجيل
        </span>
        <textarea
          value={postSubmitMessage}
          onChange={(e) => {
            setPostSubmitMessage(e.target.value);
            setSave("idle");
          }}
          rows={4}
          className={inputCls}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={save === "saving" || !eventName.trim()}
          className="rounded-lg bg-[var(--color-rust)] px-6 py-2.5 font-bold text-white transition hover:bg-[var(--color-rust-hover)] disabled:opacity-60"
        >
          {save === "saving" ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        {save === "saved" ? (
          <span className="text-sm font-bold text-[var(--color-ok)]">تم الحفظ.</span>
        ) : null}
        {save === "error" ? (
          <span className="text-sm font-bold text-[var(--color-full)]">
            تعذّر الحفظ. حاول مجدداً.
          </span>
        ) : null}
      </div>
    </form>
  );
}
