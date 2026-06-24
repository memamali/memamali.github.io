"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formFields, type FormField } from "@/lib/formConfig";
import { isValidBahrainMobile, toArabicDigits, toWesternDigits } from "@/lib/utils";
import { MEN_ONLY_MARKER } from "@/lib/defaults";
import type { Config } from "@/lib/types";
import { BrandHeader } from "./BrandHeader";
import PostSubmit from "./PostSubmit";

function validate(field: FormField, raw: string): string | null {
  const value = raw.trim();
  if (field.required && !value) return "هذا الحقل مطلوب";
  if (!value) return null;
  if (field.type === "number") {
    const western = toWesternDigits(value);
    if (!/^\d+$/.test(western)) return "يرجى إدخال رقم صحيح";
    if (field.min != null && Number(western) < field.min) {
      return `القيمة يجب ألا تقل عن ${toArabicDigits(field.min)}`;
    }
  }
  if (field.type === "tel" && !isValidBahrainMobile(value)) {
    return "رقم هاتف بحريني غير صحيح (يبدأ بـ ٣ أو ٦ ومكوّن من ٨ أرقام)";
  }
  if (field.type === "select" && field.options && !field.options.includes(value)) {
    return "يرجى الاختيار من القائمة";
  }
  return null;
}

export default function RegistrationForm({ config }: { config: Config }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <PostSubmit message={config.postSubmitMessage} />;

  const setValue = (id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of formFields) {
      const err = validate(f, values[f.id] ?? "");
      if (err) nextErrors[f.id] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = formFields.find((f) => nextErrors[f.id]);
      if (first) document.getElementById(first.id)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of formFields) {
        const v = (values[f.id] ?? "").trim();
        payload[f.id] =
          f.type === "number"
            ? Number(toWesternDigits(v))
            : f.type === "tel"
              ? toWesternDigits(v)
              : v;
      }
      await addDoc(collection(db, "responses"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      setDone(true);
    } catch {
      setSubmitError("تعذّر إرسال التسجيل. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-8">
      <BrandHeader />

      <div className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="space-y-1.5 border-b border-[var(--color-line)] pb-5">
          {config.description.split("\n").map((line, i) =>
            line.includes(MEN_ONLY_MARKER) ? (
              <p
                key={i}
                className="rounded-lg border border-[var(--color-rust)]/60 bg-[var(--color-rust)]/30 px-3 py-2 text-center font-bold text-white"
              >
                {line}
              </p>
            ) : (
              <p
                key={i}
                className="text-[15px] leading-relaxed text-[var(--color-muted)]"
              >
                {line}
              </p>
            ),
          )}
        </div>

        <form noValidate onSubmit={onSubmit} className="mt-5 space-y-5">
          {formFields.map((field) => (
            <Field
              key={field.id}
              field={field}
              value={values[field.id] ?? ""}
              error={errors[field.id]}
              onChange={(v) => setValue(field.id, v)}
            />
          ))}

          {submitError ? (
            <p className="rounded-lg bg-[var(--color-full)]/15 px-3 py-2 text-center text-sm text-[var(--color-full)]">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[var(--color-rust)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-rust-hover)] active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "جارٍ الإرسال…" : "تسجيل الحضور"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-white outline-none transition placeholder:text-[var(--color-faint)]";
  const borderCls = error
    ? "border-[var(--color-full)]"
    : "border-[var(--color-line)] focus:border-[var(--color-focus)]";
  const cls = `${base} ${borderCls}`;
  const errorId = `${field.id}-error`;

  return (
    <div>
      <label htmlFor={field.id} className="mb-2 block text-sm text-[var(--color-muted)]">
        {field.label}
        {field.required ? <span className="text-[var(--color-full)]"> *</span> : null}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cls}
        />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`${cls} ${value ? "" : "text-[var(--color-faint)]"}`}
        >
          <option value="" disabled>
            اختر…
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="text-black">
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.id}
          type={field.type === "number" ? "text" : field.type}
          inputMode={
            field.type === "number"
              ? "numeric"
              : field.type === "tel"
                ? "tel"
                : undefined
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cls}
        />
      )}

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--color-full)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
