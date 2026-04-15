"use client";

import Link from "next/link";
import { HelpCircle, LifeBuoy, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "../theme/ThemeToggle";

type SimpleItem = { href: string; label: string };
type DescriptionItem = SimpleItem & { description: string };
type IconName = "HelpCircle" | "LifeBuoy" | "Sparkles";
type IconItem = SimpleItem & { icon: IconName };

type SimpleLink = { href: string; label: string; submenu?: false };
type DescriptionSubmenu = { label: string; submenu: true; type: "description"; items: DescriptionItem[] };
type SimpleSubmenu = { label: string; submenu: true; type: "simple"; items: SimpleItem[] };
type IconSubmenu = { label: string; submenu: true; type: "icon"; items: IconItem[] };
type SubmenuLink = DescriptionSubmenu | SimpleSubmenu | IconSubmenu;
type NavLink = SimpleLink | SubmenuLink;

const navigationLinks: readonly NavLink[] = [
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

const iconMap = {
  HelpCircle,
  LifeBuoy,
  Sparkles,
} as const satisfies Record<IconName, unknown>;

function SubmenuIcon({ name }: { name: IconName }) {
  const Icon = iconMap[name];
  return <Icon size={16} className="text-brand" aria-hidden="true" />;
}

function DesktopSubmenu({ link }: { link: SubmenuLink }) {
  switch (link.type) {
    case "description":
      return (
        <ul className="grid w-[440px] gap-2 p-3">
          {link.items.map((item) => (
            <li key={item.label}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-border/60 focus:bg-border/60"
                >
                  <div className="text-sm font-semibold leading-none text-foreground">
                    {item.label}
                  </div>
                  <p className="line-clamp-2 pt-1 text-xs leading-snug text-muted">
                    {item.description}
                  </p>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      );

    case "simple":
      return (
        <ul className="grid w-[420px] gap-2 p-3 md:w-[460px] md:grid-cols-2">
          {link.items.map((item) => (
            <li key={item.label}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className="block rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-border/60 focus:bg-border/60"
                >
                  <div className="text-sm font-medium leading-none text-foreground">
                    {item.label}
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      );

    case "icon":
      return (
        <ul className="grid w-[420px] gap-2 p-3 md:w-[460px] md:grid-cols-2">
          {link.items.map((item) => (
            <li key={item.label}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-border/60 focus:bg-border/60"
                >
                  <SubmenuIcon name={item.icon} />
                  <span className="text-sm font-medium leading-none text-foreground">
                    {item.label}
                  </span>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      );
  }
}

function DesktopNav() {
  return (
    <div className="max-md:hidden">
      <NavigationMenu>
        <NavigationMenuList>
          {navigationLinks.map((link) => (
            <NavigationMenuItem key={link.label}>
              {link.submenu ? (
                <>
                  <NavigationMenuTrigger>{link.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <DesktopSubmenu link={link} />
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    href={link.href}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-border/60 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  );
}

function MobileNavLink({ link }: { link: NavLink }) {
  if (!link.submenu) {
    return (
      <NavigationMenuLink
        href={link.href}
        className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground hover:bg-border/60"
      >
        {link.label}
      </NavigationMenuLink>
    );
  }

  return (
    <>
      <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {link.label}
      </div>
      <ul>
        {link.items.map((item) => (
          <li key={item.label}>
            <NavigationMenuLink
              href={item.href}
              className="block rounded-lg px-2 py-2 text-sm text-foreground hover:bg-border/60"
            >
              {item.label}
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </>
  );
}

function MobileNav() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="group md:hidden" variant="ghost" size="icon" aria-label="Abrir menú">
          <svg
            className="pointer-events-none"
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12L20 12"
              className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
            />
            <path
              d="M4 12H20"
              className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
            />
            <path
              d="M4 12H20"
              className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
            />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2 md:hidden">
        <NavigationMenu className="max-w-none *:w-full">
          <NavigationMenuList className="flex-col items-start gap-0">
            {navigationLinks.map((link) => (
              <NavigationMenuItem key={link.label} className="w-full">
                <MobileNavLink link={link} />
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </PopoverContent>
    </Popover>
  );
}

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 px-4 backdrop-blur-md md:px-6">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MobileNav />
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-foreground transition-colors hover:text-brand"
              aria-label="Ambulante — inicio"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-pin">
                <MapPin size={16} aria-hidden="true" />
              </span>
              Ambulante
            </Link>
            <DesktopNav />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/map">Ver mapa</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/map">Abrir la app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
