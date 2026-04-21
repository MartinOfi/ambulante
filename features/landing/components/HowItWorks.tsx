import { SectionHeader, Text } from "@/shared/components/typography";
import { HowItWorksClient } from "./HowItWorksClient";

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-surface px-4 py-16 sm:px-6 sm:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-foreground opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <SectionHeader eyebrow="Cómo funciona" title="Cinco pasos. Cero fricción." />
            <Text variant="body-sm" className="mt-4 max-w-md text-muted">
              Un sistema de coordinación en tiempo real entre clientes y tiendas ambulantes. Tocá un
              nodo para explorar cada paso.
            </Text>
          </div>

          <div className="flex items-center justify-center">
            <HowItWorksClient />
          </div>
        </div>
      </div>
    </section>
  );
}
