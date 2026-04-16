"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AutoRefreshProps {
  intervalMs?: number;
}

export function AutoRefresh({ intervalMs = 5000 }: AutoRefreshProps) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date());
    const id = setInterval(() => {
      setTicking(true);
      router.refresh();
      setLastUpdated(new Date());
      setTimeout(() => setTicking(false), 600);
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-brand-muted">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
          ticking ? "bg-emerald-400" : "bg-brand-muted/40"
        }`}
      />
      Обновлено в{" "}
      <span suppressHydrationWarning>
        {lastUpdated
          ? lastUpdated.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "--:--:--"}
      </span>
    </span>
  );
}
