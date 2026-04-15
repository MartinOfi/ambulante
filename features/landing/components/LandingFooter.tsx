import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const COLUMNS: FooterColumn[] = [
  {
    title: "Producto",
    links: [
      { label: "Mapa en vivo", href: "/map" },
      { label: "Cómo funciona", href: "#como-funciona" },
      { label: "Features", href: "#features" },
    ],
  },
  {
    title: "Para tiendas",
    links: [
      { label: "Sumá tu puesto", href: "#tiendas" },
      { label: "Cómo funciona", href: "#como-funciona" },
    ],
  },
  {
    title: "Recursos",
    links: [{ label: "Preguntas frecuentes", href: "#faq" }],
  },
];

const CONTACT_ITEMS = [
  { icon: Mail, label: "hola@ambulante.app", href: "mailto:hola@ambulante.app" },
  { icon: MapPin, label: "Buenos Aires, Argentina", href: null },
] as const;

export function LandingFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface px-4 pb-8 pt-16 sm:px-6 lg:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Brand block */}
          <div className="lg:max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight text-foreground transition-colors hover:text-brand"
              aria-label="Ambulante — inicio"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-pin">
                <MapPin size={16} aria-hidden="true" />
              </span>
              Ambulante
            </Link>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              Coordinación de encuentros físicos en tiempo real. Conectamos clientes con tiendas
              ambulantes sin procesar pagos ni intermediar la venta. La calle sigue siendo la calle.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-brand">
                  {column.title}
                </p>
                <ul className="mt-5 space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-muted transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-widest text-brand">
                Contacto
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {CONTACT_ITEMS.map(({ icon: Icon, label, href }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-start gap-2 text-muted transition-colors hover:text-foreground"
                      >
                        <Icon size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                        <span>{label}</span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-2 text-muted">
                        <Icon size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                        <address className="not-italic">{label}</address>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Ambulante. Todos los derechos reservados.</p>
          <p>
            Hecho para la calle ·{" "}
            <Link href="/map" className="text-brand transition-colors hover:text-foreground">
              Abrir la app
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
