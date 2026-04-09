import Link from "next/link";

type Props = { searchParams: Promise<{ order?: string }> };

export const metadata = { title: "Заказ оформлен" };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-brand-heading">Спасибо за заказ!</h1>
      {order ? (
        <p className="mt-4 text-brand-muted">
          Номер заказа:{" "}
          <span className="font-mono text-brand">#{order}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-brand-muted">
        Мы свяжемся с вами по указанным контактам.
      </p>
      <Link
        href="/catalog"
        className="mt-8 inline-block rounded-xl bg-brand px-6 py-2 font-semibold text-white hover:bg-brand-hover"
      >
        Продолжить покупки
      </Link>
    </div>
  );
}
