import type { Metadata } from "next";
import { IncomingOrdersInboxContainer } from "@/features/orders/components/IncomingOrdersInbox";

export const metadata: Metadata = {
  title: "Pedidos entrantes",
  robots: { index: false },
};

export default function StoreOrdersPage() {
  return (
    <main className="p-6">
      <IncomingOrdersInboxContainer />
    </main>
  );
}
