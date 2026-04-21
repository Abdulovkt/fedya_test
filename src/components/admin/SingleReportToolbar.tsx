"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DEMAND_LIMIT_OPTIONS } from "@/lib/reports-constants";

type Props = {
  /** Путь страницы отчёта без query, напр. /admin/reports/demand */
  reportPath: string;
  /** YYYY-MM-DD */
  fromValue: string;
  /** YYYY-MM-DD */
  toValue: string;
  /** Если задано — в URL добавляется limit= и показывается выбор числа позиций (отчёт о спросе). */
  demandLimitValue?: number;
  backHref?: string;
  backLabel?: string;
};

export function SingleReportToolbar({
  reportPath,
  fromValue,
  toValue,
  demandLimitValue,
  backHref = "/admin/reports",
  backLabel = "Все отчёты",
}: Props) {
  const router = useRouter();
  const [localFrom, setLocalFrom] = useState(fromValue);
  const [localTo, setLocalTo] = useState(toValue);
  const [localLimit, setLocalLimit] = useState(
    () => String(demandLimitValue ?? DEMAND_LIMIT_OPTIONS[0]),
  );

  useEffect(() => {
    setLocalFrom(fromValue);
    setLocalTo(toValue);
  }, [fromValue, toValue]);

  useEffect(() => {
    if (demandLimitValue !== undefined) {
      setLocalLimit(String(demandLimitValue));
    }
  }, [demandLimitValue]);

  const pushQuery = useCallback(
    (nextFrom: string, nextTo: string, nextLimit?: string) => {
      let f = nextFrom;
      let t = nextTo;
      if (f > t) {
        const x = f;
        f = t;
        t = x;
      }
      setLocalFrom(f);
      setLocalTo(t);
      const q = new URLSearchParams();
      q.set("from", f);
      q.set("to", t);
      if (demandLimitValue !== undefined) {
        const lim = nextLimit ?? String(localLimit);
        q.set("limit", lim);
        setLocalLimit(lim);
      }
      router.push(`${reportPath}?${q.toString()}`);
    },
    [demandLimitValue, localLimit, reportPath, router],
  );

  const applyRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      pushQuery(nextFrom, nextTo, demandLimitValue !== undefined ? localLimit : undefined);
    },
    [demandLimitValue, localLimit, pushQuery],
  );

  const applyLimit = useCallback(
    (nextLimit: string) => {
      setLocalLimit(nextLimit);
      let f = localFrom;
      let t = localTo;
      if (f > t) {
        const x = f;
        f = t;
        t = x;
      }
      const q = new URLSearchParams();
      q.set("from", f);
      q.set("to", t);
      q.set("limit", nextLimit);
      router.push(`${reportPath}?${q.toString()}`);
    },
    [localFrom, localTo, reportPath, router],
  );

  return (
    <div className="print:hidden mb-6 space-y-4 border-b border-brand-border pb-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={backHref}
          className="text-brand-teal underline decoration-brand-teal/30 underline-offset-2 hover:decoration-brand-teal"
        >
          ← {backLabel}
        </Link>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="report-from" className="text-xs font-medium text-brand-heading">
              От
            </label>
            <input
              id="report-from"
              type="date"
              value={localFrom}
              onChange={(e) => applyRange(e.target.value, localTo)}
              className="w-full max-w-[11rem] rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-to" className="text-xs font-medium text-brand-heading">
              До
            </label>
            <input
              id="report-to"
              type="date"
              value={localTo}
              onChange={(e) => applyRange(localFrom, e.target.value)}
              className="w-full max-w-[11rem] rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
            />
          </div>
          {demandLimitValue !== undefined ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="report-limit" className="text-xs font-medium text-brand-heading">
                Позиций в каждой таблице
              </label>
              <select
                id="report-limit"
                value={localLimit}
                onChange={(e) => applyLimit(e.target.value)}
                className="w-full max-w-[11rem] rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              >
                {DEMAND_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex w-fit items-center justify-center border border-brand-heading bg-brand-heading px-4 py-2 text-sm font-medium text-white hover:bg-brand-heading/90"
        >
          Печать или сохранить PDF
        </button>
      </div>
    </div>
  );
}
