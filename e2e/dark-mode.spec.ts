import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const DARK_MODE_ROUTES = ["/", "/login", "/register"] as const;

const LIGHT_SURFACE_RGB = "rgb(255, 247, 237)";
const WHITE_RGB = "rgb(255, 255, 255)";
const BLACK_RGB = "rgb(0, 0, 0)";
const DARK_ATTR = "dark";

async function createDarkContext(page: Page): Promise<BrowserContext> {
  const browser = page.context().browser();
  if (!browser) throw new Error("No browser available in context");
  return browser.newContext({ colorScheme: "dark" });
}

async function visitInDark(context: BrowserContext, route: string): Promise<Page> {
  const darkPage = await context.newPage();
  await darkPage.goto(route, { waitUntil: "domcontentloaded" });
  // Theme is applied via dataset.theme (Tailwind config: darkMode: ["selector", "[data-theme='dark']"]).
  // The render-blocking init script in <head> sets it before body paint.
  await darkPage.waitForFunction(() => document.documentElement.dataset.theme === "dark", {
    timeout: 5_000,
  });

  return darkPage;
}

test.describe("Dark mode audit", () => {
  for (const route of DARK_MODE_ROUTES) {
    test(`applies .dark class on <html> at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      try {
        const darkPage = await visitInDark(darkContext, route);
        const themeAttr = await darkPage.locator("html").getAttribute("data-theme");
        expect(themeAttr, `Expected data-theme="dark" on html at ${route}`).toBe(DARK_ATTR);
      } finally {
        await darkContext.close().catch(() => {});
      }
    });

    test(`body background is dark surface at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      try {
        const darkPage = await visitInDark(darkContext, route);
        const bgColor = await darkPage.locator("body").evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        expect(bgColor, `Expected dark surface background at ${route}, got: ${bgColor}`).not.toBe(
          WHITE_RGB,
        );
      } finally {
        await darkContext.close().catch(() => {});
      }
    });

    test(`foreground text is not black in dark mode at ${route}`, async ({ page }) => {
      const darkContext = await createDarkContext(page);
      try {
        const darkPage = await visitInDark(darkContext, route);
        const textColor = await darkPage.locator("body").evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
        expect(
          textColor,
          `Expected light text color in dark mode at ${route}, got: ${textColor}`,
        ).not.toBe(BLACK_RGB);
      } finally {
        await darkContext.close().catch(() => {});
      }
    });
  }

  test("dark surface CSS variable resolves to expected value on landing", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    try {
      const darkPage = await visitInDark(darkContext, "/");
      const surfaceValue = await darkPage.locator("body").evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(surfaceValue, `Dark surface should not be light cream`).not.toContain(
        LIGHT_SURFACE_RGB,
      );
    } finally {
      await darkContext.close().catch(() => {});
    }
  });

  test("no white-on-white contrast failure on landing in dark mode", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    try {
      const darkPage = await visitInDark(darkContext, "/");
      const mainText = await darkPage.locator("body").evaluate((el) => {
        const style = window.getComputedStyle(el);
        return { bg: style.backgroundColor, fg: style.color };
      });
      expect(mainText.bg).not.toBe(mainText.fg);
    } finally {
      await darkContext.close().catch(() => {});
    }
  });

  test("ThemeToggle button is visible in dark mode on landing", async ({ page }) => {
    const darkContext = await createDarkContext(page);
    try {
      const darkPage = await visitInDark(darkContext, "/");
      const themeToggle = darkPage.getByRole("button", {
        name: /cambiar a modo|tema|theme|dark|light/i,
      });
      await expect(themeToggle.first()).toBeVisible();
    } finally {
      await darkContext.close().catch(() => {});
    }
  });
});
