import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Вход — админка" };

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.email) {
    redirect("/admin");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="text-lg font-bold text-brand">
        SportNutrition
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-brand-heading">Вход администратора</h1>
      <LoginForm />
      <Link href="/" className="mt-6 text-sm text-brand-muted hover:text-brand-teal">
        На главную
      </Link>
    </div>
  );
}
