import type { LegalSection } from "@/features/legal/types";

export interface TermsPageProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
  readonly privacyLinkLabel: string;
  readonly backToHomeLabel: string;
  readonly relatedLinksLabel: string;
}
