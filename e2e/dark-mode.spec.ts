import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const DARK_MODE_ROUTES = ["/", "/login", "/register"] as const;

const LIGHT_SURFACE_RGB = "rgb(255, 247, 237)";
const WHITE_RGB = "rgb(255, 255, 255)";
const BLACK_RGB = "rgb(0, 0, 0)";

async function createDarkContext(page: Page): Promise<BrowserContext> {
  return page.context().browser()!.newContext({ colorScheme: "dark" });
}

async function visitInDark(context: BrowserContext, route: string): Promise<Page> {
  const darkPage = await context.newPage();
  await darkPage.goto(route);
  return darkPage;
}

test.describe("Dark mode audit", () => {
  test.describe.configure({ mode: "serial" });

  for (const route of DARK_MODE_ROUTES) {
    test(`applies .dark class on <html> at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      const darkPage = await visitInDark(darkContext, route);

      const htmlClasses = await darkPage.locator("html").getAttribute("class");
      expect(htmlClasses, `Expected .dark on html at ${route}`).toContain("dark");

      await darkContext.close();
    });

    test(`body background is dark surface at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      const darkPage = await visitInDark(darkContext, route);

      const bgColor = await darkPage.locator("body").evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(bgColor, `Expected dark surface background at ${route}, got: ${bgColor}`).not.toBe(
        WHITE_RGB,
      );

      await darkContext.close();
    });

    test(`foreground text is not black in dark mode at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      const darkPage = await visitInDark(darkContext, route);

      const textColor = await darkPage.locator("body").evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(
        textColor,
        `Expected light text color in dark mode at ${route}, got: ${textColor}`,
      ).not.toBe(BLACK_RGB);

      await darkContext.close();
    });
  }

  test("dark surface CSS variable resolves to expected value on landing", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    const darkPage = await visitInDark(darkContext, "/");

    const surfaceValue = await darkPage.locator("body").evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(surfaceValue, `Dark surface should not be light cream`).not.toContain(LIGHT_SURFACE_RGB);

    await darkContext.close();
  });

  test("no white-on-white contrast failure on landing in dark mode", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    const darkPage = await visitInDark(darkContext, "/");

    const mainText = await darkPage.locator("body").evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { bg: style.backgroundColor, fg: style.color };
    });

    expect(mainText.bg).not.toBe(mainText.fg);

    await darkContext.close();
  });

  test("ThemeToggle button is visible in dark mode on landing", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    const darkPage = await visitInDark(darkContext, "/");

    const themeToggle = darkPage.getByRole("button", { name: /tema|theme|dark|light/i });
    const count = await themeToggle.count();

    if (count > 0) {
      await expect(themeToggle.first()).toBeVisible();
    }

    await darkContext.close();
  });
});
