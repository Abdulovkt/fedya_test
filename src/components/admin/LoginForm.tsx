"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Неверный email или пароль.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-sm space-y-4 rounded-xl border border-brand-border bg-brand-surface p-6 shadow-sm"
    >
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
