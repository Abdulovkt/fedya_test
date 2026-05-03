"use client";

import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/admin/(auth)/login/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
    >
      {pending ? "Вход…" : "Войти"}
    </button>
  );
}

type Props = {
  authError?: string;
};

export function LoginForm({ authError }: Props) {
  return (
    <form
      action={loginAction}
      className="mx-auto mt-8 max-w-sm space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm"
    >
      <input type="hidden" name="redirectTo" value="/admin" />
      {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
      <div>
        <label htmlFor="email" className="block text-sm text-brand-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-brand-muted">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-brand-heading"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
