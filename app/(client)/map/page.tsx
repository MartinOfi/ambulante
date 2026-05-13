import type { Metadata } from "next";
import { MapScreenContainer } from "@/features/map";

export const metadata: Metadata = {
  title: "Mapa",
  robots: { index: false },
};

export default function MapPage() {
  return <MapScreenContainer />;
}
