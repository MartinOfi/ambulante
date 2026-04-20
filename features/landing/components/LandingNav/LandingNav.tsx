import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ThemeToggle } from "@/shared/components/theme/ThemeToggle";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";

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
