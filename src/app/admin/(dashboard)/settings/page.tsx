import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Настройки — Почта" };

export default async function AdminSettingsPage() {
  const current = await getSettings();
  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-heading">Настройки</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Параметры почтового сервера для уведомлений клиентам.
      </p>
      <div className="mt-8">
        <SettingsForm current={current} />
      </div>
    </div>
  );
}
