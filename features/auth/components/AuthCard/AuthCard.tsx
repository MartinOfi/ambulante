import { LiveMiniMap } from "@/shared/components/LiveMiniMap";

const BULB_X = [80, 180, 280, 380, 480, 580, 680, 780, 880, 980, 1080, 1180, 1280, 1380] as const;

interface AuthCardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 lg:w-2/5 bg-white dark:bg-[#070A12]">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="font-display text-[40px] font-bold tracking-tight text-brand leading-none">
              Ambulante
            </p>
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-slate-400 dark:text-slate-500 pt-2">
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
        className="relative hidden md:flex md:w-1/2 lg:w-3/5 flex-col items-center justify-center gap-8 overflow-hidden bg-[#0D0400]"
      >
        {/* Photo background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/auth-bg.webp')" }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0400]/60 via-[#3B1000]/50 to-[#6B1E00]/70" />

        {/* String lights */}
        <svg
          className="absolute top-0 left-0 w-full pointer-events-none"
          height="52"
          viewBox="0 0 1440 52"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-20 12 Q180 30 360 12 Q540 -6 720 12 Q900 30 1080 12 Q1260 -6 1460 12"
            stroke="#92400E"
            strokeWidth="1.5"
            fill="none"
            opacity="0.75"
          />
          {BULB_X.map((x, i) => {
            const cy = i % 2 === 0 ? 28 : 14;
            const wireY = i % 2 === 0 ? 18 : 5;
            return (
              <g key={x}>
                <line
                  x1={x}
                  y1={wireY}
                  x2={x}
                  y2={cy - 4}
                  stroke="#92400E"
                  strokeWidth="1"
                  opacity="0.75"
                />
                <ellipse cx={x} cy={cy + 4} rx="5" ry="7" fill="#FCD34D" opacity="0.88" />
                <ellipse cx={x} cy={cy + 4} rx="10" ry="12" fill="#FCD34D" opacity="0.12" />
              </g>
            );
          })}
        </svg>

        {/* Warm bokeh orb */}
        <div
          className="amb-orb-float absolute rounded-full bg-orange-500/20 blur-[100px] w-[500px] h-[500px] pointer-events-none"
          style={{ left: "-10%", top: "-10%", animationDuration: "12s" }}
        />

        {/* Headline */}
        <div className="relative z-10 w-full max-w-lg px-6 text-center">
          <p className="font-display text-6xl lg:text-7xl font-bold uppercase leading-[0.88] tracking-[-0.03em] text-white drop-shadow-2xl">
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
