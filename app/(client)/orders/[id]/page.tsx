import { OrderTrackingContainer } from "@/features/orders/components/OrderTracking";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderTrackingContainer orderId={id} />;
}
