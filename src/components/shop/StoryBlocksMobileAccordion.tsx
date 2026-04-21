"use client";

import { useId, useState } from "react";
import type { StoryBlock } from "@/components/shop/story-blocks-data";

export function StoryBlocksMobileAccordion({ blocks }: { blocks: StoryBlock[] }) {
  const reactId = useId();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        const isOpen = open[block.tab] ?? false;
        const panelId = `${reactId}-panel-${idx}`;
        const headerId = `${reactId}-header-${idx}`;

        return (
          <div
            key={block.tab}
            className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-sm"
          >
            <h3 className="text-base font-semibold leading-snug">
              <button
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-brand-heading transition hover:bg-brand-elevated/80"
                onClick={() =>
                  setOpen((o) => ({ ...o, [block.tab]: !isOpen }))
                }
              >
                <span className="min-w-0">{block.title}</span>
                <span
                  className="shrink-0 text-lg leading-none text-brand-muted tabular-nums"
                  aria-hidden="true"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="border-t border-brand-border px-4 pb-4 pt-2 text-sm leading-relaxed text-brand-muted"
            >
              <div className="space-y-3">
                {block.paragraphs.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
