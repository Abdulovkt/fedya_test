import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Вход — админка" };

type SearchParams = Promise<{ error?: string }>;

function mapAuthError(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (code === "CredentialsSignin") return "Неверный email или пароль.";
  if (code === "Configuration")
    return "Ошибка конфигурации входа (проверьте AUTH_SECRET / NEXTAUTH_SECRET).";
  if (code === "AccessDenied") return "Доступ запрещён.";
  return "Не удалось войти. Попробуйте ещё раз.";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user?.email) {
    redirect("/admin");
  }
  const { error } = await searchParams;
  const authError = mapAuthError(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="text-lg font-bold text-brand">
        SportNutrition
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-brand-heading">Вход администратора</h1>
      <LoginForm authError={authError} />
      <Link href="/" className="mt-6 text-sm text-brand-muted hover:text-brand-teal">
        На главную
      </Link>
    </div>
  );
}
