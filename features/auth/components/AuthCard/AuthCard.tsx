import { LiveMiniMap } from "@/shared/components/LiveMiniMap";
import { MOTION } from "@/shared/styles/tokens";
import { StringLights } from "./StringLights";

interface AuthCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 lg:w-2/5 bg-white dark:bg-surface">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="font-display text-display-auth font-bold tracking-tight text-brand leading-none">
              Ambulante
            </p>
            <p className="text-xs-tight font-medium tracking-tag uppercase text-slate-400 dark:text-slate-500 pt-2">
              Tu mercado en movimiento
            </p>
          </div>

          <h1 className="mb-6 text-center text-lg font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h1>

          {children}
        </div>
      </div>

      {/* Right panel — photo + map (desktop only) */}
      <div
        aria-hidden="true"
        className="relative hidden md:flex md:w-1/2 lg:w-3/5 flex-col items-center justify-center gap-8 overflow-hidden bg-auth-dark"
      >
        {/* Photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/auth-bg.webp')" }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-auth-dark/60 via-auth-overlay-mid/50 to-auth-overlay-light/70" />

        {/* String lights */}
        <StringLights />

        {/* Warm bokeh orb */}
        <div
          className="amb-orb-float absolute rounded-full bg-orange-500/20 blur-orb w-orb-lg h-orb-lg pointer-events-none"
          style={{
            left: "-10%",
            top: "-10%",
            animationDuration: `${MOTION.durations.orbFloat / 1000}s`,
          }}
        />

        {/* Headline */}
        <div className="relative z-10 w-full max-w-lg px-6 text-center">
          <p className="font-display text-6xl lg:text-7xl font-bold uppercase leading-display-auth tracking-display text-white drop-shadow-2xl">
            Todo lo
            <br />
            <span className="text-amber-400">ambulante,</span>
            <br />
            cerca tuyo.
          </p>
          <p className="mt-4 text-sm font-medium text-white/60 tracking-wide">
            Tiendas activas en tu zona, ahora mismo.
          </p>
        </div>

        {/* LiveMiniMap */}
        <div className="relative z-10 w-full max-w-lg px-6">
          <LiveMiniMap />
        </div>
      </div>
    </div>
  );
}
