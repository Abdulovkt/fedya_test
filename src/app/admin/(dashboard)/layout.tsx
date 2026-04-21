import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
      <AdminSidebarNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
