"use client";

import { MapPinned, Radar, ShoppingBasket, Send, Handshake } from "lucide-react";

import RadialOrbitalTimeline, {
  type TimelineItem,
} from "@/shared/components/ui/radial-orbital-timeline";

const TIMELINE: readonly TimelineItem[] = [
  {
    id: 1,
    title: "Activá ubicación",
    date: "Paso 01",
    content: "Abrimos el mapa centrado en vos. Sin registro obligatorio para explorar tu zona.",
    category: "Cliente",
    icon: MapPinned,
    relatedIds: [2],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    title: "Descubrí cerca",
    date: "Paso 02",
    content:
      "Tiendas ambulantes activas dentro de tu radio configurable. Filtros por rubro y horario.",
    category: "Cliente",
    icon: Radar,
    relatedIds: [1, 3],
    status: "completed",
    energy: 85,
  },
  {
    id: 3,
    title: "Armá tu pedido",
    date: "Paso 03",
    content:
      "Elegís productos y cantidades del catálogo de la tienda. Snapshot de precios al momento de pedir.",
    category: "Cliente",
    icon: ShoppingBasket,
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 70,
  },
  {
    id: 4,
    title: "Mandá intención",
    date: "Paso 04",
    content:
      "El vendedor recibe tu pedido en tiempo real y lo acepta o rechaza en menos de 3 minutos.",
    category: "Coordinación",
    icon: Send,
    relatedIds: [3, 5],
    status: "pending",
    energy: 55,
  },
  {
    id: 5,
    title: "Encuentro físico",
    date: "Paso 05",
    content:
      "Coordinás el encuentro y la venta ocurre cara a cara. La plataforma no toca el dinero.",
    category: "Encuentro",
    icon: Handshake,
    relatedIds: [4],
    status: "pending",
    energy: 40,
  },
];

export function HowItWorksClient() {
  return <RadialOrbitalTimeline timelineData={TIMELINE} />;
}
