import { Text } from "./Text";

interface SectionHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
}

export function SectionHeader({ eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl">
      <Text variant="overline" className="text-brand">
        {eyebrow}
      </Text>
      <Text variant="display-lg" className="mt-3 text-foreground">
        {title}
      </Text>
    </div>
  );
}
