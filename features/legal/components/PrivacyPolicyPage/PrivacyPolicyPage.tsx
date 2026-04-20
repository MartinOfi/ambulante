"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/constants/routes";
import { Stack } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";

export function PrivacyPolicyPage() {
  const t = useTranslations("Pages.PrivacyPolicy");

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Stack gap={8}>
          <Stack gap={2}>
            <Text as="h1" variant="display-lg">
              {t("title")}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              {t("lastUpdated")}
            </Text>
          </Stack>

          <Text variant="body" className="text-foreground/80">
            {t("intro")}
          </Text>

          <LegalSection title={t("section1Title")} body={t("section1Body")} />
          <LegalSection title={t("section2Title")} body={t("section2Body")} />
          <LegalSection title={t("section3Title")} body={t("section3Body")} />
          <LegalSection title={t("section4Title")} body={t("section4Body")} />
          <LegalSection title={t("section5Title")} body={t("section5Body")} />

          <nav className="flex flex-wrap gap-4 border-t border-border pt-6">
            <Link
              href={ROUTES.legal.terms}
              className="text-sm font-medium text-[hsl(var(--brand-primary))] underline-offset-2 hover:underline"
            >
              {t("termsLink")}
            </Link>
            <Link
              href={ROUTES.public.home}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("backToHome")}
            </Link>
          </nav>
        </Stack>
      </div>
    </main>
  );
}

interface LegalSectionProps {
  readonly title: string;
  readonly body: string;
}

function LegalSection({ title, body }: LegalSectionProps) {
  return (
    <Stack gap={2}>
      <Text variant="heading-sm">{title}</Text>
      <Text variant="body-sm" className="text-foreground/80">
        {body}
      </Text>
    </Stack>
  );
}
