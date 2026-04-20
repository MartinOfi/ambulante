import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyPage } from "@/features/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages.PrivacyPolicy");
  return { title: t("title") };
}

export default function PrivacyPage() {
  return <PrivacyPolicyPage />;
}
