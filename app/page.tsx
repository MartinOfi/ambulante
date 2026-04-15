import { LandingNav } from "./_components/landing/LandingNav";
import { Hero } from "./_components/landing/Hero";
import { HowItWorks } from "./_components/landing/HowItWorks";
import { Features } from "./_components/landing/Features";
import { ForVendors } from "./_components/landing/ForVendors";
import { Faq } from "./_components/landing/Faq";
import { LandingFooter } from "./_components/landing/LandingFooter";

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
