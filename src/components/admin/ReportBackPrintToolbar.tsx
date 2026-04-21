"use client";

import Link from "next/link";

type Props = {
  backHref?: string;
  backLabel?: string;
};

export function ReportBackPrintToolbar({
  backHref = "/admin/reports",
  backLabel = "Все отчёты",
}: Props) {
  return (
    <div className="print:hidden mb-6 flex flex-col gap-4 border-b border-brand-border pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Link
        href={backHref}
        className="text-sm text-brand-teal underline decoration-brand-teal/30 underline-offset-2 hover:decoration-brand-teal"
      >
        ← {backLabel}
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex w-fit items-center justify-center border border-brand-heading bg-brand-heading px-4 py-2 text-sm font-medium text-white hover:bg-brand-heading/90"
      >
        Печать или сохранить PDF
      </button>
    </div>
  );
}
