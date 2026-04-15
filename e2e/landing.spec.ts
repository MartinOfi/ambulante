import { expect, test } from "@playwright/test";

const HERO_HEADLINE_FRAGMENT = "Todo lo ambulante";

test.describe("landing page", () => {
  test("renders the hero headline", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(HERO_HEADLINE_FRAGMENT);
  });
});
