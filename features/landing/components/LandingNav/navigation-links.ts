export type IconName = "HelpCircle" | "LifeBuoy" | "Sparkles";

export interface SimpleItem {
  readonly href: string;
  readonly label: string;
}

export interface DescriptionItem extends SimpleItem {
  readonly description: string;
}

export interface IconItem extends SimpleItem {
  readonly icon: IconName;
}

export interface SimpleLink {
  readonly href: string;
  readonly label: string;
  readonly submenu?: false;
}

export interface DescriptionSubmenu {
  readonly label: string;
  readonly submenu: true;
  readonly type: "description";
  readonly items: readonly DescriptionItem[];
}

export interface SimpleSubmenu {
  readonly label: string;
  readonly submenu: true;
  readonly type: "simple";
  readonly items: readonly SimpleItem[];
}

export interface IconSubmenu {
  readonly label: string;
  readonly submenu: true;
  readonly type: "icon";
  readonly items: readonly IconItem[];
}

export type SubmenuLink = DescriptionSubmenu | SimpleSubmenu | IconSubmenu;
export type NavLink = SimpleLink | SubmenuLink;

export const NAVIGATION_LINKS: readonly NavLink[] = [
  { href: "#como-funciona", label: "Cómo funciona" },
  {
    label: "Producto",
    submenu: true,
    type: "description",
    items: [
      {
        href: "/map",
        label: "Mapa en vivo",
        description: "Encontrá tiendas ambulantes activas cerca tuyo en tiempo real.",
      },
      {
        href: "#features",
        label: "Pedidos sin pago",
        description: "Coordiná el encuentro físico, la venta sigue ocurriendo en la calle.",
      },
      {
        href: "#features",
        label: "PWA instalable",
        description: "Funciona como app nativa, sin pasar por las tiendas oficiales.",
      },
    ],
  },
  {
    label: "Para tiendas",
    submenu: true,
    type: "simple",
    items: [
      { href: "#tiendas", label: "Sumá tu puesto" },
      { href: "#tiendas", label: "Bandeja de pedidos" },
      { href: "#tiendas", label: "Toggle de disponibilidad" },
      { href: "#tiendas", label: "Onboarding asistido" },
    ],
  },
  {
    label: "Recursos",
    submenu: true,
    type: "icon",
    items: [
      { href: "#faq", label: "Preguntas frecuentes", icon: "HelpCircle" },
      { href: "#faq", label: "Soporte", icon: "LifeBuoy" },
      { href: "#features", label: "Sobre Ambulante", icon: "Sparkles" },
    ],
  },
];
