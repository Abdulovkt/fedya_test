"use client";

import { useActionState } from "react";
import { saveEmailSettings, type SaveSettingsState } from "@/app/actions/admin";
import type { EmailSettings } from "@/lib/settings";

export function SettingsForm({ current }: { current: EmailSettings }) {
  const [state, action, pending] = useActionState<SaveSettingsState, FormData>(
    saveEmailSettings,
    null,
  );

  return (
    <form action={action} className="max-w-xl space-y-6">
      {state?.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Настройки сохранены
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Site URL */}
      <section className="rounded-xl border border-brand-border bg-brand-surface/40 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-brand-heading">Сайт</h2>
        <Field
          name="site_url"
          label="URL сайта"
          hint="Используется в ссылках в письмах (например https://ваш-сайт.ru)"
          defaultValue={current.site_url}
          placeholder="https://example.com"
        />
      </section>

      {/* SMTP */}
      <section className="rounded-xl border border-brand-border bg-brand-surface/40 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-brand-heading">SMTP — исходящая почта</h2>

        <Field
          name="smtp_from"
          label="Адрес отправителя (From)"
          hint='Имя и адрес. Например: "SportNutrition" <info@example.com>'
          defaultValue={current.smtp_from}
          placeholder="info@example.com"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="smtp_host"
            label="SMTP сервер"
            defaultValue={current.smtp_host}
            placeholder="smtp.gmail.com"
          />
          <Field
            name="smtp_port"
            label="Порт"
            defaultValue={current.smtp_port}
            placeholder="587"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="smtp_secure"
            name="smtp_secure"
            type="checkbox"
            value="true"
            defaultChecked={current.smtp_secure === "true"}
            className="h-4 w-4 rounded border-brand-border"
          />
          <label htmlFor="smtp_secure" className="text-sm text-brand-muted">
            SSL/TLS (порт 465)
          </label>
        </div>

        <Field
          name="smtp_user"
          label="Логин (email)"
          defaultValue={current.smtp_user}
          placeholder="your@gmail.com"
        />

        <Field
          name="smtp_pass"
          label="Пароль / App Password"
          type="password"
          hint="Для Gmail: используйте пароль приложения (не пароль аккаунта)"
          defaultValue={current.smtp_pass}
          placeholder="••••••••••••"
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Сохранение…" : "Сохранить настройки"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-brand-muted">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-brand-muted/70">{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1.5 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-heading outline-none focus:border-brand/50"
      />
    </div>
  );
}
