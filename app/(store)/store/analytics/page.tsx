import type { Metadata } from "next";
import { StoreAnalyticsDashboardContainer } from "@/features/store-analytics";

export const metadata: Metadata = {
  title: "Analíticas",
  robots: { index: false },
};

export default function StoreAnalyticsPage() {
  return <StoreAnalyticsDashboardContainer />;
}
