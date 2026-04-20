"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Phase = "hidden" | "title" | "frame" | "items" | "lineBottom";

const WHY_US_ITEMS = [
  {
    title: "Широкий выбор",
    subtitle: "высококачественных препаратов",
    ring: "from-brand-teal/95 to-brand-teal/65",
    icon: "pills",
  },
  {
    title: "Быстрое оформление",
    subtitle: "заказа без лишних шагов",
    ring: "from-brand/95 to-brand-secondary/70",
    icon: "bag",
  },
  {
    title: "Оперативная доставка",
    subtitle: "аккуратно и по срокам",
    ring: "from-emerald-500/90 to-teal-500/70",
    icon: "delivery",
  },
  {
    title: "Гарантия качества",
    subtitle: "на весь ассортимент",
    ring: "from-sky-600/90 to-brand-teal/65",
    icon: "shield",
  },
  {
    title: "Консультация",
    subtitle: "по применению и подбору",
    ring: "from-amber-400/95 to-amber-500/70",
    icon: "consult",
  },
] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function WhyUsPanel() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("hidden");

  const steps = useMemo(() => {
    const titleDurationMs = 720;
    const afterTitlePauseMs = 80;

    const frameDurationMs = 340;
    const afterFramePauseMs = 90;

    const lineDurationMs = 700;
    const itemStaggerMs = 60;
    const itemDurationMs = 560;

    const tTitle = 0;
    const tFrame = tTitle + titleDurationMs + afterTitlePauseMs;
    const tItems = tFrame + frameDurationMs + afterFramePauseMs;
    const tBottomLine = tItems + 520;

    return {
      titleDurationMs,
      frameDurationMs,
      lineDurationMs,
      itemStaggerMs,
      itemDurationMs,
      tTitle,
      tFrame,
      tItems,
      tBottomLine,
    } as const;
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let cancelled = false;
    const timeouts: number[] = [];

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || cancelled) return;
        obs.disconnect();

        const run = (delayMs: number, next: Phase) => {
          timeouts.push(
            window.setTimeout(() => {
              if (!cancelled) setPhase(next);
            }, delayMs),
          );
        };

        run(steps.tTitle, "title");
        run(steps.tFrame, "frame");
        run(steps.tItems, "items");
        run(steps.tBottomLine, "lineBottom");
      },
      // Match the "Почему мы" heading reveal feel from RevealOnScroll
      { root: null, threshold: 0.22, rootMargin: "0px 0px -16% 0px" },
    );

    obs.observe(el);
    return () => {
      cancelled = true;
      obs.disconnect();
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [steps]);

  const titleShown = phase === "title" || phase === "frame" || phase === "items" || phase === "lineBottom";
  const frameOn = phase === "frame" || phase === "items" || phase === "lineBottom";
  const lineTopOn = frameOn;
  const itemsOn = phase === "items" || phase === "lineBottom";
  const lineBottomOn = phase === "lineBottom";

  return (
    <div ref={rootRef} className="mt-6">
      <h2
        className={cx(
          "text-2xl font-bold text-brand-heading",
          "transform-gpu will-change-transform transition-[opacity,transform] ease-[cubic-bezier(0.2,1,0.2,1)]",
          titleShown ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
        )}
        style={{
          transitionDuration: `${steps.titleDurationMs}ms`,
        }}
      >
        Почему мы
      </h2>

      <div
        className={cx(
          "mt-6 overflow-hidden rounded-2xl border border-brand-border bg-brand-elevated/60",
          "transform-gpu will-change-transform transition-[opacity,transform] ease-[cubic-bezier(0.2,1,0.2,1)]",
          frameOn
            ? "opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 translate-y-3 scale-[0.985]",
        )}
        style={
          {
            "--why-line-dur": `${steps.lineDurationMs}ms`,
            transitionDuration: `${steps.frameDurationMs}ms`,
          } as CSSProperties
        }
      >
        <div
          className={cx(
            "transition-[opacity] duration-[var(--why-line-dur,900ms)] ease-[cubic-bezier(0.2,1,0.2,1)]",
            lineTopOn ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cx(
              "h-px w-full origin-left bg-gradient-to-r from-transparent via-brand-teal/45 to-transparent",
              "transform-gpu transition-transform duration-[var(--why-line-dur,900ms)] ease-[cubic-bezier(0.2,1,0.2,1)]",
              lineTopOn ? "scale-x-100" : "scale-x-[0.35]",
            )}
          />
        </div>

        <div className="divide-y divide-brand-border/80 sm:divide-y-0 sm:divide-x sm:divide-brand-border/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_US_ITEMS.map((item, idx) => {
              const on = itemsOn;

              return (
                <div
                  key={item.title}
                  className={cx(
                    "transform-gpu will-change-transform transition-[opacity,transform] ease-[cubic-bezier(0.2,1,0.2,1)]",
                    on ? "opacity-100 translate-x-0 translate-y-0" : "opacity-0 translate-x-3 translate-y-1",
                  )}
                  style={{
                    transitionDuration: `${steps.itemDurationMs}ms`,
                    transitionDelay: on ? `${idx * steps.itemStaggerMs}ms` : "0ms",
                  }}
                >
                  <div className="flex items-start gap-3 px-4 py-4 sm:px-5 sm:py-5">
                    <div
                      className={cx(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_10px_22px_-16px_rgba(7,26,54,0.55)] ring-1 ring-white/30",
                        item.ring,
                      )}
                      aria-hidden="true"
                    >
                      {item.icon === "pills" ? <IconPills /> : null}
                      {item.icon === "bag" ? <IconBag /> : null}
                      {item.icon === "delivery" ? <IconDelivery /> : null}
                      {item.icon === "shield" ? <IconShield /> : null}
                      {item.icon === "consult" ? <IconConsult /> : null}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-sm font-semibold leading-snug text-brand-heading">{item.title}</div>
                      <div className="mt-1 text-[13px] leading-snug text-brand-muted">{item.subtitle}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={cx(
            "transition-[opacity] duration-[var(--why-line-dur,900ms)] ease-[cubic-bezier(0.2,1,0.2,1)]",
            lineBottomOn ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cx(
              "h-px w-full origin-left bg-gradient-to-r from-transparent via-brand-teal/45 to-transparent",
              "transform-gpu transition-transform duration-[var(--why-line-dur,900ms)] ease-[cubic-bezier(0.2,1,0.2,1)]",
              lineBottomOn ? "scale-x-100" : "scale-x-[0.35]",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function IconPills() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M12 3.2c.7 0 1.3.4 1.6 1l2.2 4.4c.1.2.3.4.5.5l4.4 2.2a1.8 1.8 0 0 1 0 3.2l-4.4 2.2a1 1 0 0 0-.5.5l-2.2 4.4a1.8 1.8 0 0 1-3.2 0l-2.2-4.4a1 1 0 0 0-.5-.5l-4.4-2.2a1.8 1.8 0 0 1 0-3.2l4.4-2.2c.2-.1.4-.3.5-.5l2.2-4.4c.3-.6.9-1 1.6-1Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M8.7 9.2h6.6c.4 0 .7.3.7.7v7.6c0 .4-.3.7-.7.7H8.7a.7.7 0 0 1-.7-.7V9.9c0-.4.3-.7.7-.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.6 7.4h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M10.2 12.2h3.6M10.2 14.6h3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="9.1" cy="16.9" r="0.9" fill="currentColor" />
      <circle cx="11.2" cy="16.9" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M8.2 8.2V7.2a3.8 3.8 0 0 1 7.6 0v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.4 8.6h11.2c.7 0 1.2.6 1.1 1.3l-.8 9.2c-.1.7-.7 1.2-1.4 1.2H7.5c-.7 0-1.3-.5-1.4-1.2l-.8-9.2c-.1-.7.4-1.3 1.1-1.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.4 12.2h5.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M4.2 16.2h2.2c.5 1.1 1.6 1.8 2.8 1.6a2.6 2.6 0 0 0 2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4.2 16.2V8.9c0-.7.6-1.3 1.3-1.3h6.1c.6 0 1.1.4 1.2 1l.7 3.1c.1.5.6.9 1.2.9h3.9c.7 0 1.3.6 1.3 1.3v3.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.2" cy="16.2" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.4" cy="16.2" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 7.6h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <path
        d="M18.6 10.6c1.1.3 2 .9 2.6 1.8.3.5.1 1.1-.4 1.4l-1.1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M12 3.4l6.2 2.4c.4.2.7.6.7 1.1v6.1c0 3.6-2.6 6.6-6.2 7.4a.9.9 0 0 1-.4 0c-3.6-.8-6.2-3.8-6.2-7.4V6.9c0-.5.3-.9.7-1.1L12 3.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.4 12.4l1.7 1.7 3.8-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconConsult() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M8.2 8.2h7.6c.7 0 1.3.6 1.3 1.3v6.1c0 .7-.6 1.3-1.3 1.3H8.2a1.3 1.3 0 0 1-1.3-1.3V9.5c0-.7.6-1.3 1.3-1.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.6 6.6V5.9a2.4 2.4 0 0 1 4.8 0v.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.8 12.2h4.4M9.8 14.8h3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <path
        d="M12 16.8l-.9 2.2a.35.35 0 0 0 .33.45h1.14a.35.35 0 0 0 .33-.45L12 16.8Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
