import { notFound } from "next/navigation";
import { z } from "zod";

import { OrderTrackingContainer } from "@/features/orders/components/OrderTracking";

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

const orderIdSchema = z.string().uuid();

export default async function OrderTrackingPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = orderIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  return <OrderTrackingContainer orderId={parsed.data} />;
}
