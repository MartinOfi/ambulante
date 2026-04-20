import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

import { CLIENT_ROUTES, PUBLIC_ROUTES } from "./constants";

const CRITICAL_IMPACTS = ["critical", "serious"] as const;

type CriticalImpact = (typeof CRITICAL_IMPACTS)[number];

function isCriticalImpact(impact: string | null | undefined): impact is CriticalImpact {
  return impact != null && (CRITICAL_IMPACTS as readonly string[]).includes(impact);
}

function makeClientSessionCookie(): string {
  const session = {
    accessToken: "mock-access-client",
    refreshToken: "mock-refresh-client",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "client-user-id", email: "client@test.com", role: "client" },
  };
  return btoa(JSON.stringify(session));
}

async function setClientSession(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: makeClientSessionCookie(),
      domain: "localhost",
      path: "/",
    },
  ]);
}

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

async function auditRoute(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const criticalViolations = results.violations.filter((violation) =>
    isCriticalImpact(violation.impact),
  );

  expect(criticalViolations, formatViolations(criticalViolations)).toHaveLength(0);
}

test.describe("accessibility audit — WCAG AA — public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has no critical or serious violations`, async ({ page }) => {
      await auditRoute(page, route);
    });
  }
});

test.describe("accessibility audit — WCAG AA — client routes", () => {
  for (const route of CLIENT_ROUTES) {
    test(`${route} has no critical or serious violations`, async ({ page, context }) => {
      await setClientSession(context);
      await auditRoute(page, route);
    });
  }
});
