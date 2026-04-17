import Link from "next/link";
import { TrendingUp, Gift, Eye, ArrowRight } from "lucide-react";

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: TrendingUp,
    title: "Anticipá demanda",
    body: "Sabés cuántos clientes van antes de que lleguen.",
  },
  {
    icon: Gift,
    title: "Cero costo",
    body: "Gratis para todas las tiendas. Sin letra chica.",
  },
  {
    icon: Eye,
    title: "Más visibilidad",
    body: "Clientes nuevos te descubren mientras operás.",
  },
];

export function ForVendors() {
  return (
    <section
      id="tiendas"
      className="relative overflow-hidden bg-surface px-4 py-24 sm:px-6 sm:py-32"
    >
      {/* Subtle brand wash so this section reads different from Features
          without breaking the light-theme continuity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/10"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="font-display text-xs font-bold uppercase tracking-eyebrow text-brand">
            Para tiendas ambulantes
          </span>
          <h2 className="mt-3 font-display text-display-hero font-bold uppercase leading-display tracking-display text-foreground">
            Tu puesto,
            <br />
            <span className="text-brand">visible</span> cuando importa.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Subí tu catálogo, activá tu disponibilidad y recibí intenciones de compra de clientes en
            tu zona. Sin apps separadas ni hardware extra.
          </p>
          <Link
            href="/map"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-ink px-7 font-display text-sm font-bold uppercase tracking-wide text-white shadow-pin transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Registrá tu puesto
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid gap-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-card border-2 border-foreground bg-surface-elevated p-5 shadow-card-brutal transition-transform hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-card-brutal-hover"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
