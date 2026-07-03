"use client";

import { useConfig } from "@/hooks/useConfig";
import RegistrationForm from "@/components/RegistrationForm";
import SeatBoard from "@/components/SeatBoard";
import LoadingScreen from "@/components/LoadingScreen";
import { BrandHeader } from "@/components/BrandHeader";

export default function Home() {
  const { config, exists, loading, error } = useConfig();

  if (loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return <CenteredNote logo text="تعذّر الاتصال بالخادم. حاول لاحقاً." />;
  }
  if (!exists || !config) {
    return <CenteredNote logo text="سيُفتح التسجيل قريباً بإذن الله." />;
  }
  if (config.mode === "live") {
    return <SeatBoard config={config} />;
  }
  if (!config.registrationOpen) {
    return <CenteredNote logo text="انتهى التسجيل. شكراً لكم — نراكم ليلة العرض." />;
  }
  return <RegistrationForm config={config} />;
}

function CenteredNote({ text, logo = false }: { text: string; logo?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      {logo ? <BrandHeader /> : null}
      <p className="text-lg text-[var(--color-muted)]">{text}</p>
    </main>
  );
}
