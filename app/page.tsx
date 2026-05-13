import type { Metadata } from "next";
import {
  Faq,
  Features,
  ForVendors,
  Hero,
  HowItWorks,
  LandingFooter,
  LandingNav,
} from "@/features/landing";

export const metadata: Metadata = {
  title: {
    absolute: "Ambulante — Tiendas ambulantes cerca tuyo en tiempo real",
  },
};

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-surface text-foreground">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <ForVendors />
      <Faq />
      <LandingFooter />
    </main>
  );
}
