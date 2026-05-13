import type { Metadata } from "next";
import { OrderHistoryScreenContainer } from "@/features/orders/components/OrderHistoryScreen";

export const metadata: Metadata = {
  title: "Mis pedidos",
  robots: { index: false },
};

export default function OrdersPage() {
  return <OrderHistoryScreenContainer />;
}
