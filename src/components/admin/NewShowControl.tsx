"use client";

import { useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startNewShow } from "@/lib/archive";
import { formFields } from "@/lib/formConfig";
import { useConfig } from "@/hooks/useConfig";
import {
  toCSV,
  downloadFile,
  formatDateTime,
  toArabicDigits,
} from "@/lib/utils";
import type { ResponseDoc } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "running"; step: string }
  | { kind: "done"; archived: number; showsReset: number }
  | { kind: "error"; message: string };

// Backup the live registrations as CSV before anything is archived/cleared —
// same column layout as the الردود tab export.
function backupCSV(rows: ResponseDoc[]): void {
  const csvRows = rows.map((r) => {
    const ts = r.createdAt as Timestamp | null;
    const createdAtLabel =
      ts && typeof ts.toDate === "function" ? formatDateTime(ts.toDate()) : "—";
    const row: { createdAtLabel: string } & Record<string, unknown> = {
      createdAtLabel,
    };
    for (const f of formFields) row[f.id] = r[f.id];
    return row;
  });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  downloadFile(`registrations-backup-${stamp}.csv`, toCSV(formFields, csvRows));
}

export default function NewShowControl() {
  const { config } = useConfig();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const running = status.kind === "running";

  async function run() {
    const label = (config?.eventName ?? "عرض") + " — " + new Date().toLocaleDateString("en-CA");
    const confirmed = window.confirm(
      "بدء عرض جديد؟\n\n" +
        "• سيتم تنزيل نسخة CSV من التسجيلات الحالية.\n" +
        "• تُنقل جميع التسجيلات إلى الأرشيف (لا تُحذف نهائياً).\n" +
        "• يعود عدّاد التسجيلات إلى صفر وتُعاد تعبئة مقاعد جميع العروض.\n" +
        "• يعود الموقع إلى وضع التسجيل.\n\n" +
        "هل تريد المتابعة؟",
    );
    if (!confirmed) return;

    try {
      setStatus({ kind: "running", step: "جارٍ تنزيل نسخة احتياطية…" });
      const snap = await getDocs(
        query(collection(db, "responses"), orderBy("createdAt", "desc")),
      );
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResponseDoc);
      if (rows.length > 0) backupCSV(rows);

      setStatus({ kind: "running", step: "جارٍ الأرشفة وإعادة الضبط…" });
      const result = await startNewShow(label);

      setStatus({ kind: "running", step: "جارٍ فتح التسجيل…" });
      await updateDoc(doc(db, "config", "main"), {
        mode: "registration",
        registrationOpen: true,
        currentShowId: null,
      });

      setStatus({
        kind: "done",
        archived: result.archived,
        showsReset: result.showsReset,
      });
    } catch {
      setStatus({
        kind: "error",
        message: "تعذّر إكمال العملية. لم يُحذف شيء قبل نجاح الأرشفة — أعد المحاولة.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-bold text-white">بدء عرض جديد</h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
          يُجهّز الموقع لعرض جديد: تُنقل التسجيلات الحالية إلى الأرشيف، ويعود عدّاد
          التسجيلات إلى صفر، وتُعاد تعبئة مقاعد جميع العروض، ويعود الموقع إلى وضع
          التسجيل.
        </p>

        <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-muted)]">
          <li>• تُنزَّل نسخة CSV احتياطية أولاً.</li>
          <li>• البيانات القديمة محفوظة في الأرشيف — لا تُحذف نهائياً.</li>
          <li>• حدّث تاريخ العرض من تبويب «المحتوى» قبل فتح التسجيل.</li>
        </ul>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="mt-5 w-full rounded-xl bg-[var(--color-rust)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-rust-hover)] active:scale-[0.99] disabled:opacity-60"
        >
          {running ? "جارٍ التنفيذ…" : "بدء عرض جديد"}
        </button>
      </section>

      {status.kind === "running" ? (
        <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm text-[var(--color-muted)]">
          {status.step}
        </p>
      ) : null}

      {status.kind === "done" ? (
        <div className="rounded-xl border border-[var(--color-ok)]/50 bg-[var(--color-ok)]/10 px-4 py-4 text-center text-sm">
          <p className="font-bold text-[var(--color-ok)]">
            تم بدء عرض جديد بنجاح.
          </p>
          <p className="mt-1 text-[var(--color-muted)]">
            أُرشفت {toArabicDigits(status.archived)} تسجيلاً، وأُعيد ضبط{" "}
            {toArabicDigits(status.showsReset)} عرضاً.
          </p>
        </div>
      ) : null}

      {status.kind === "error" ? (
        <p className="rounded-xl border border-[var(--color-full)]/50 bg-[var(--color-full)]/10 px-4 py-3 text-center text-sm text-[var(--color-full)]">
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
