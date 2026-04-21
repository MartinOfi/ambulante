import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css";
import { ThemeProvider } from "@/shared/components/theme/ThemeProvider";
import { Toaster } from "@/shared/components/ui/toaster";
import { NuqsProvider } from "@/shared/providers/NuqsProvider";
import { QueryProvider } from "@/shared/providers/QueryProvider";
import { Analytics } from "@vercel/analytics/next";
import dynamic from "next/dynamic";

const ServiceWorkerUpdateBannerContainer = dynamic(
  () =>
    import("@/shared/components/ServiceWorkerUpdateBanner").then(
      (m) => m.ServiceWorkerUpdateBannerContainer,
    ),
  { ssr: false },
);

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ambulante.app";
const SITE_TITLE = "Ambulante — Tiendas ambulantes cerca tuyo en tiempo real";
const SITE_DESCRIPTION =
  "Las tiendas ambulantes aparecen y desaparecen. Ambulante te muestra cuáles están activas hoy, cerca tuyo — para que no camines en vano. Sin pagos, sin esperas.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Ambulante",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Ambulante",
  keywords: [
    "tiendas ambulantes",
    "food trucks",
    "puestos callejeros",
    "vendedores ambulantes",
    "mapa en tiempo real",
    "comida callejera",
    "Argentina",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Ambulante",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ambulante — Tiendas ambulantes cerca tuyo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ambulante",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ambulante",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description: SITE_DESCRIPTION,
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Ambulante",
  operatingSystem: "Web, iOS, Android",
  applicationCategory: "LifestyleApplication",
  description: SITE_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "ARS",
  },
  url: SITE_URL,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#EA580C",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Blocking init — runs before React hydrates to prevent flash of wrong theme.
            Content is a static string literal with no interpolation, so there is no
            injection surface. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('ambulante-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`}
        </Script>
        {/* JSON-LD structured data. Content is JSON.stringify of static literal
            objects defined above with zero user input — safe by construction.
            This is the official Next.js pattern for schema.org markup. */}
        <Script id="ld-organization" type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </Script>
        <Script id="ld-software-app" type="application/ld+json">
          {JSON.stringify(softwareAppSchema)}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <NuqsProvider>
            <QueryProvider>
              <ThemeProvider>
                {children}
                <Toaster />
                <ServiceWorkerUpdateBannerContainer />
                <Analytics />
              </ThemeProvider>
            </QueryProvider>
          </NuqsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
