import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { receiveOrder } from "@/features/orders/actions";
import { STORE_ORDER_TRANSITION_ERROR_CODE } from "@/features/orders/store-transitions.constants";
import { createServerClient } from "@/shared/repositories/supabase/client";
import { SupabaseOrderRepository } from "@/shared/repositories";
import { ROUTES } from "@/shared/constants/routes";
import { StoreOrderDetailContainer } from "@/features/orders/components/StoreOrderDetail";

export const metadata: Metadata = {
  title: "Detalle del pedido",
  robots: { index: false },
};

interface PageProps {
  readonly params: Promise<{ readonly orderId: string }>;
}

const orderIdSchema = z.string().uuid();

export default async function StoreOrderDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) notFound();
  const publicId = parsed.data;

  // Transition ENVIADO→RECIBIDO (idempotent — safe on every render / back navigation).
  const receiveResult = await receiveOrder({ publicId });
  if (
    !receiveResult.ok &&
    receiveResult.errorCode === STORE_ORDER_TRANSITION_ERROR_CODE.UNAUTHENTICATED
  ) {
    redirect(ROUTES.auth.login);
  }

  const client = await createServerClient();
  const order = await new SupabaseOrderRepository(client).findById(publicId);
  if (order === null) redirect(ROUTES.store.orders);

  return (
    <main className="p-6">
      <StoreOrderDetailContainer initialOrder={order} />
    </main>
  );
}
