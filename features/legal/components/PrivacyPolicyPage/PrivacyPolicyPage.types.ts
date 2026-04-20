import type { LegalSection } from "@/features/legal/types";

export interface PrivacyPolicyPageProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
  readonly termsLinkLabel: string;
  readonly backToHomeLabel: string;
  readonly relatedLinksLabel: string;
}
