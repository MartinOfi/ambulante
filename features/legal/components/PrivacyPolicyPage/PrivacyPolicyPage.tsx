import Link from "next/link";
import { Stack } from "@/shared/components/layout";
import { Text } from "@/shared/components/typography";
import { ROUTES } from "@/shared/constants/routes";
import type { LegalSection } from "@/features/legal/types";
import type { PrivacyPolicyPageProps } from "./PrivacyPolicyPage.types";

export function PrivacyPolicyPage({
  title,
  lastUpdated,
  intro,
  sections,
  termsLinkLabel,
  backToHomeLabel,
  relatedLinksLabel,
}: PrivacyPolicyPageProps) {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Stack gap={8}>
          <Stack gap={2}>
            <Text as="h1" variant="display-lg">
              {title}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              {lastUpdated}
            </Text>
          </Stack>

          <Text variant="body" className="text-foreground/80">
            {intro}
          </Text>

          {sections.map((section) => (
            <LegalSectionBlock key={section.title} section={section} />
          ))}

          <nav
            aria-label={relatedLinksLabel}
            className="flex flex-wrap gap-4 border-t border-border pt-6"
          >
            <Link
              href={ROUTES.legal.terms}
              className="text-sm font-medium text-[hsl(var(--brand-primary))] underline-offset-2 hover:underline"
            >
              {termsLinkLabel}
            </Link>
            <Link
              href={ROUTES.public.home}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              {backToHomeLabel}
            </Link>
          </nav>
        </Stack>
      </div>
    </main>
  );
}

function LegalSectionBlock({ section }: { readonly section: LegalSection }) {
  return (
    <Stack gap={2}>
      <Text as="h2" variant="heading-sm">
        {section.title}
      </Text>
      <Text variant="body-sm" className="text-foreground/80">
        {section.body}
      </Text>
    </Stack>
  );
}
