"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { useCartStore } from "@/shared/stores/cart";
import { MAX_EXPAND_RADIUS } from "@/features/map/constants";
import { useRadiusParam } from "@/features/map/hooks/useRadiusParam";
import { useStoresNearbyQuery } from "@/features/map/hooks/useStoresNearbyQuery";
import { useStoresAvailabilityRealtime } from "@/features/map/hooks/useStoresAvailabilityRealtime";
import { submitOrder } from "@/features/order-flow/actions";
import { MapScreen } from "./MapScreen";

export function MapScreenContainer() {
  const [radius, setRadius] = useRadiusParam();
  const geo = useGeolocation();
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const coords = geo.status === "granted" ? geo.coords : null;
  const { data: stores = [] } = useStoresNearbyQuery({ coords, radius });
  useStoresAvailabilityRealtime();

  const items = useCartStore((s) => s.items);
  const activeStoreId = useCartStore((s) => s.activeStoreId);
  const clearCart = useCartStore((s) => s.clearCart);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.productPriceArs * item.quantity, 0);

  const handleExpandRadius = useCallback(() => {
    setRadius(MAX_EXPAND_RADIUS);
  }, [setRadius]);

  const handleRecenter = useCallback(() => {
    geo.request();
  }, [geo.request]);

  const handleManualSearch = useCallback(() => {}, []);

  const handleSelectStore = useCallback((id: string) => {
    setSelectedStoreId(id);
  }, []);

  const handleDismissStoreDetail = useCallback(() => {
    setSelectedStoreId(null);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (activeStoreId === null || items.length === 0) return;

    const result = await submitOrder({
      storeId: activeStoreId,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    });

    if (result.ok) {
      clearCart();
      router.push(`/orders/${result.publicId}`);
    }
  }, [activeStoreId, items, clearCart, router]);

  return (
    <MapScreen
      stores={stores}
      radius={radius}
      geo={geo}
      isRecentering={geo.status === "loading"}
      selectedStoreId={selectedStoreId}
      cartItemCount={cartItemCount}
      cartTotal={cartTotal}
      onRadiusChange={setRadius}
      onExpandRadius={handleExpandRadius}
      onRecenter={handleRecenter}
      onRetryGeolocation={handleRecenter}
      onManualSearch={handleManualSearch}
      onSelectStore={handleSelectStore}
      onDismissStoreDetail={handleDismissStoreDetail}
      onCheckout={handleCheckout}
    />
  );
}
