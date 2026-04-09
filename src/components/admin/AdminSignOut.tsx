"use client";

import { signOut } from "next-auth/react";

export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs text-brand-muted underline hover:text-brand-heading"
    >
      Выйти
    </button>
  );
}
