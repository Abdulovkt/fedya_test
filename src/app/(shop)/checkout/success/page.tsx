import Link from "next/link";

type Props = { searchParams: Promise<{ order?: string; token?: string }> };

export const metadata = { title: "Заказ оформлен" };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order, token } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-brand-heading">
        Спасибо за заказ!
      </h1>
      {order && (
        <p className="mt-3 text-brand-muted">
          Номер заказа:{" "}
          <span className="font-mono font-semibold text-brand">#{order}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-brand-muted">
        Мы свяжемся с вами по указанным контактам.
      </p>

      {order && token && (
        <div className="mt-6 rounded-xl border border-brand-teal/30 bg-brand-teal/5 px-5 py-4">
          <p className="text-sm font-medium text-brand-heading">
            Есть вопросы по заказу?
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Напишите нам в чат — ответим быстро.
          </p>
          <Link
            href={`/chat/${order}?token=${token}`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-teal/80"
          >
            Открыть чат
          </Link>
        </div>
      )}

      <Link
        href="/catalog"
        className="mt-6 inline-block rounded-xl bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        Продолжить покупки
      </Link>
    </div>
  );
}
