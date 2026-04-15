"use client";

import Link from "next/link";
import { HelpCircle, LifeBuoy, Sparkles } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/shared/components/ui/navigation-menu";
import { NAVIGATION_LINKS, type IconName, type SubmenuLink } from "./navigation-links";

const ICON_MAP = {
  HelpCircle,
  LifeBuoy,
  Sparkles,
} as const satisfies Record<IconName, unknown>;

function SubmenuIcon({ name }: { readonly name: IconName }) {
  const Icon = ICON_MAP[name];
  return <Icon size={16} className="text-brand" aria-hidden="true" />;
}

function DesktopSubmenu({ link }: { readonly link: SubmenuLink }) {
  if (link.type === "description") {
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
  }

  if (link.type === "simple") {
    return (
      <ul className="grid w-[420px] gap-2 p-3 md:w-[460px] md:grid-cols-2">
        {link.items.map((item) => (
          <li key={item.label}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className="block rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-border/60 focus:bg-border/60"
              >
                <div className="text-sm font-medium leading-none text-foreground">{item.label}</div>
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    );
  }

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
              <span className="text-sm font-medium leading-none text-foreground">{item.label}</span>
            </Link>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  );
}

export function DesktopNav() {
  return (
    <div className="max-md:hidden">
      <NavigationMenu>
        <NavigationMenuList>
          {NAVIGATION_LINKS.map((link) => (
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
