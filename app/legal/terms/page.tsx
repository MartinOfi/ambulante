import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TermsPage } from "@/features/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.Terms");
  return { title: t("title") };
}

export default async function TermsRoute() {
  const t = await getTranslations("Pages.Terms");

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
    { title: t("section4Title"), body: t("section4Body") },
    { title: t("section5Title"), body: t("section5Body") },
  ];

  return (
    <TermsPage
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t("intro")}
      sections={sections}
      privacyLinkLabel={t("privacyLink")}
      backToHomeLabel={t("backToHome")}
      relatedLinksLabel={t("relatedLinksLabel")}
    />
  );
}
