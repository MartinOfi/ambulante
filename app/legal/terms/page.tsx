import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsPage } from "@/features/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Terms");
  return { title: t("title") };
}

export default function TermsRoute() {
  return <TermsPage />;
}
