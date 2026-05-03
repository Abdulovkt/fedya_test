import { auth } from "@/auth";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { ShopSessionProvider } from "@/components/shop/ShopSessionProvider";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <ShopSessionProvider session={session}>
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ShopSessionProvider>
  );
}
