import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders the hero headline", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const heading = page.getByTestId("hero-heading");
    await expect(heading).toBeVisible();
  });
});
