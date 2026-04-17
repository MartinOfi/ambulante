import { Coffee, Flower2, IceCream, Palette, UtensilsCrossed } from "lucide-react";
import type { ComponentType } from "react";

export type VendorState = "active" | "pulsing" | "fading";
export type LabelSide = "left" | "right";

export interface MapVendor {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly name: string;
  readonly distance: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly state: VendorState;
  readonly labelSide: LabelSide;
}

export const MAP_VENDORS: readonly MapVendor[] = [
  {
    id: "chori",
    x: 32,
    y: 28,
    name: "El Rey del Choripán",
    distance: "320 m",
    icon: UtensilsCrossed,
    state: "pulsing",
    labelSide: "right",
  },
  {
    id: "flores",
    x: 72,
    y: 40,
    name: "Flores de Palermo",
    distance: "1.2 km",
    icon: Flower2,
    state: "active",
    labelSide: "left",
  },
  {
    id: "helado",
    x: 24,
    y: 68,
    name: "Heladería Rodante",
    distance: "450 m",
    icon: IceCream,
    state: "active",
    labelSide: "right",
  },
  {
    id: "arte",
    x: 78,
    y: 72,
    name: "Artesanías Don Pepe",
    distance: "800 m",
    icon: Palette,
    state: "active",
    labelSide: "left",
  },
  {
    id: "cafe",
    x: 56,
    y: 18,
    name: "Café Móvil",
    distance: "1.5 km",
    icon: Coffee,
    state: "fading",
    labelSide: "right",
  },
];
