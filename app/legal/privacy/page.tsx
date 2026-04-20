import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyPage } from "@/features/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.PrivacyPolicy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Pages.PrivacyPolicy");

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
    { title: t("section4Title"), body: t("section4Body") },
    { title: t("section5Title"), body: t("section5Body") },
  ];

  return (
    <PrivacyPolicyPage
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t("intro")}
      sections={sections}
      termsLinkLabel={t("termsLink")}
      backToHomeLabel={t("backToHome")}
      relatedLinksLabel={t("relatedLinksLabel")}
    />
  );
}
