import Script from "next/script";
import { SectionHeader } from "./HowItWorks";

const FAQS = [
  {
    q: "¿Se procesan pagos en la app?",
    a: "No. Ambulante no toca dinero en ningún momento. La venta ocurre físicamente entre vos y la tienda, como siempre. Nosotros solo facilitamos el encuentro.",
  },
  {
    q: "¿Es gratis para los clientes y para las tiendas?",
    a: "Sí, 100% gratis en el MVP. No hay comisiones por venta, ni suscripciones, ni costos ocultos para nadie.",
  },
  {
    q: "¿Cómo protegen mi ubicación?",
    a: "Tu ubicación exacta nunca se expone a la tienda antes de que acepte tu pedido. Todo lo que ve es tu distancia aproximada. Vos decidís cuándo compartir más.",
  },
  {
    q: "¿Qué pasa si la tienda no tiene stock de lo que pedí?",
    a: "La tienda puede rechazar tu intención de compra con un click. Como no hay pago involucrado, no hay reembolsos ni trámites — simplemente buscás otra opción.",
  },
  {
    q: "¿Funciona en iPhone?",
    a: "Sí. Ambulante es una PWA instalable en iOS y Android. Desde Safari, tocá 'Compartir' y 'Añadir a pantalla de inicio'.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export function Faq() {
  return (
    <section id="faq" className="px-4 py-20 sm:px-6 sm:py-28">
      {/* JSON-LD from static FAQS array above — safe by construction, no user input. */}
      <Script id="ld-faq" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow="Preguntas frecuentes" title="Lo que todos quieren saber." />

        <div className="mt-12 divide-y divide-border/80 border-y-2 border-foreground">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold uppercase tracking-tight text-foreground sm:text-lg">
                {q}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-xl leading-none transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
