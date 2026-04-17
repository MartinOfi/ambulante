import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Radio,
  UtensilsCrossed,
  Coffee,
  IceCream,
  Flower2,
  Palette,
  BookOpen,
} from "lucide-react";
import { LiveMiniMap } from "@/shared/components/LiveMiniMap";

interface ActiveVendor {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  distance: string;
}

const ACTIVE_VENDORS: readonly ActiveVendor[] = [
  { name: "El Rey del Choripán", icon: UtensilsCrossed, distance: "320m" },
  { name: "Flores de Palermo", icon: Flower2, distance: "1.2km" },
  { name: "Heladería Rodante", icon: IceCream, distance: "450m" },
  { name: "Artesanías Don Pepe", icon: Palette, distance: "800m" },
  { name: "Café Móvil Belgrano", icon: Coffee, distance: "1.5km" },
  { name: "Libros en la Plaza", icon: BookOpen, distance: "600m" },
];

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-surface font-sans text-foreground">
      {/* Ambient brand glows — warm orange halos work on both cream and near-black */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 z-0 h-96 w-96 rounded-full bg-brand/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-40 z-0 h-96 w-96 rounded-full bg-brand/10 blur-[120px]"
      />
      {/* Dot pattern uses currentColor so it inverts with the theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 text-foreground opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Street grid — subtle city metaphor, reinforces "you are on a map" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 text-foreground opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 text-foreground opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 49.5%, currentColor 49.5%, currentColor 50.5%, transparent 50.5%)",
          backgroundSize: "320px 320px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pb-24 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col justify-center space-y-8 lg:col-span-7">
            <div className="amb-fade-in amb-delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-foreground/10">
                <LiveDot />
                <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-xs">
                  Tiendas ambulantes en vivo
                  <Sparkles className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
                </span>
              </div>
            </div>

            <h1
              data-testid="hero-heading"
              className="amb-fade-in amb-delay-200 font-display text-5xl font-bold uppercase leading-[0.9] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              Todo lo ambulante,
              <br />
              <span className="bg-gradient-to-br from-foreground via-foreground to-brand bg-clip-text text-transparent">
                cerca tuyo,
              </span>
              <br />
              ahora mismo.
            </h1>

            <p className="amb-fade-in amb-delay-300 max-w-xl text-lg leading-relaxed text-muted">
              Aparecen y desaparecen. Ambulante te muestra qué tiendas están activas hoy, para que
              no camines en vano. No procesamos pagos, no manejamos stock — solo el mapa que te dice
              quién está ahí.
            </p>

            <div className="amb-fade-in amb-delay-400 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#tiendas"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-pin transition-all hover:scale-[1.02] hover:bg-brand-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <Radio className="h-4 w-4" aria-hidden="true" />
                Registrá tu tienda · Gratis
              </Link>

              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-8 py-4 font-display text-sm font-bold uppercase tracking-wide text-foreground backdrop-blur-sm transition-colors hover:border-foreground/30 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Ver quién está activo
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5 lg:mt-12">
            <div className="amb-fade-in amb-delay-500">
              <LiveMiniMap />
            </div>

            <div className="amb-fade-in amb-delay-500 relative overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/5 py-8 backdrop-blur-xl">
              <p className="mb-6 px-8 text-sm font-medium text-muted">Activas ahora en tu zona</p>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
                }}
              >
                <div className="amb-marquee flex gap-8 whitespace-nowrap px-4">
                  {[...ACTIVE_VENDORS, ...ACTIVE_VENDORS, ...ACTIVE_VENDORS].map((vendor, i) => (
                    <div
                      key={`${vendor.name}-${i}`}
                      className="flex items-center gap-2.5 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2 transition-all hover:scale-105 hover:border-brand/40 hover:bg-brand/10"
                    >
                      <vendor.icon className="h-4 w-4 text-brand" />
                      <span className="text-sm font-semibold tracking-tight text-foreground">
                        {vendor.name}
                      </span>
                      <span className="text-xs text-muted">{vendor.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
    </span>
  );
}
