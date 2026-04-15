import { Zap, Navigation, Wallet, Bell, Smartphone, ListChecks } from "lucide-react";
import { SectionHeader } from "./HowItWorks";

const FEATURES = [
  {
    icon: Zap,
    title: "Tiempo real",
    body: "Tiendas aparecen y desaparecen del mapa al instante según estén operando.",
  },
  {
    icon: Navigation,
    title: "Geolocalización precisa",
    body: "Radio configurable desde 500m hasta 5km. Tu ubicación queda privada hasta confirmar.",
  },
  {
    icon: Wallet,
    title: "Sin pagos en la app",
    body: "La venta es física, como siempre. Cero comisiones, cero obligaciones regulatorias.",
  },
  {
    icon: Bell,
    title: "Notificaciones push",
    body: "La tienda recibe tu intención al toque. Vos te enterás cuando te confirman.",
  },
  {
    icon: Smartphone,
    title: "PWA instalable",
    body: "Se instala como una app nativa. Funciona offline para ver tu historial.",
  },
  {
    icon: ListChecks,
    title: "Estados transparentes",
    body: "Enviado, recibido, aceptado, en camino, finalizado. Sabés qué pasa en cada momento.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-surface-elevated px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Por qué Ambulante" title="Lo justo. Nada más." />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col rounded-card border border-border bg-surface p-6 transition-colors hover:border-brand"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
