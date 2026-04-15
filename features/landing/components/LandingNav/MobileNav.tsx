"use client";

import { Button } from "@/shared/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { NAVIGATION_LINKS, type NavLink } from "./navigation-links";

function MobileNavLink({ link }: { readonly link: NavLink }) {
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

function MobileMenuIcon() {
  return (
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
  );
}

export function MobileNav() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="group md:hidden"
          variant="ghost"
          size="icon"
          aria-label="Abrir menú"
        >
          <MobileMenuIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2 md:hidden">
        <NavigationMenu className="max-w-none *:w-full">
          <NavigationMenuList className="flex-col items-start gap-0">
            {NAVIGATION_LINKS.map((link) => (
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
