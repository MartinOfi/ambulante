import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const AUDIT_ROUTES = ["/", "/map"] as const;

const CRITICAL_IMPACTS = ["critical", "serious"] as const;

test.describe("accessibility audit — WCAG AA", () => {
  for (const route of AUDIT_ROUTES) {
    test(`${route} has no critical or serious violations`, async ({ page }) => {
      await page.goto(route);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();

      const criticalViolations = results.violations.filter((violation) =>
        CRITICAL_IMPACTS.includes(violation.impact as (typeof CRITICAL_IMPACTS)[number]),
      );

      expect(criticalViolations, formatViolations(criticalViolations)).toHaveLength(0);
    });
  }
});

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  if (violations.length === 0) return "";
  return violations
    .map(
      (violation) =>
        `[${violation.impact}] ${violation.id}: ${violation.description}\n` +
        violation.nodes.map((node) => `  → ${node.html}`).join("\n"),
    )
    .join("\n\n");
}
