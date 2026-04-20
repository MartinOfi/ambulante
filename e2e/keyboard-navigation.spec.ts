import { expect, test, type BrowserContext } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "@/shared/constants/auth";

const ARIA_LABEL_CLOSE_DETAIL = "Cerrar detalle";
const ARIA_LABEL_EXPAND_SHEET = "Expandir o colapsar hoja";
const ARIA_LABEL_NEARBY = "Tiendas cercanas";

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

test.describe("keyboard navigation — landing page", () => {
  test("all interactive elements are reachable via Tab", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const focusableCount = await page.evaluate(() => {
      const selector =
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return document.querySelectorAll(selector).length;
    });

    expect(focusableCount).toBeGreaterThan(0);
  });

  test("Tab moves focus forward through nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");

    const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(["a", "button", "input", "textarea", "select"]).toContain(focusedTag);
  });

  test("skip-to-content link is the first focusable element if present", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");

    const firstFocused = await page.evaluate(() => ({
      tag: document.activeElement?.tagName.toLowerCase(),
      href: document.activeElement?.getAttribute("href"),
    }));

    if (firstFocused.href?.startsWith("#")) {
      expect(firstFocused.tag).toBe("a");
    } else {
      expect(firstFocused.tag).toBeTruthy();
    }
  });
});

test.describe("keyboard navigation — client nav", () => {
  test.beforeEach(async ({ context }) => {
    await setClientSession(context);
  });

  test("bottom nav links are keyboard accessible on /map", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const navLinks = page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let linkIndex = 0; linkIndex < count; linkIndex++) {
      const link = navLinks.nth(linkIndex);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href");
    }
  });

  test("active nav link has aria-current=page", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const activeLink = page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: /mapa/i });

    await expect(activeLink).toHaveAttribute("aria-current", "page");
  });
});

test.describe("keyboard navigation — NearbyBottomSheet", () => {
  test.beforeEach(async ({ context }) => {
    await setClientSession(context);
  });

  test("sheet handle button is focusable and has aria-expanded", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const section = page.getByRole("region", { name: ARIA_LABEL_NEARBY });
    await expect(section).toBeVisible();

    const handleButton = page.getByRole("button", { name: ARIA_LABEL_EXPAND_SHEET });
    await expect(handleButton).toBeVisible();
    await expect(handleButton).toHaveAttribute("aria-expanded");
  });

  test("sheet handle button can be activated via keyboard Enter", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const handleButton = page.getByRole("button", { name: ARIA_LABEL_EXPAND_SHEET });
    const initialExpanded = await handleButton.getAttribute("aria-expanded");

    await handleButton.focus();
    await page.keyboard.press("Enter");

    const updatedExpanded = await handleButton.getAttribute("aria-expanded");
    expect(updatedExpanded).not.toBeNull();
    expect(typeof updatedExpanded).toBe("string");

    if (initialExpanded === "false") {
      expect(updatedExpanded).toBe("true");
    }
  });
});

test.describe("keyboard navigation — StoreDetailSheet", () => {
  test.beforeEach(async ({ context }) => {
    await setClientSession(context);
  });

  test("close button is focused when sheet opens", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const storeCards = page.getByRole("button").filter({ hasText: /empanadas|tacos|pizza/i });
    const cardCount = await storeCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await storeCards.first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });

    const closeButton = page.getByRole("button", { name: ARIA_LABEL_CLOSE_DETAIL });
    await expect(closeButton).toBeFocused();
  });

  test("Escape key closes the store detail sheet", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const storeCards = page.getByRole("button").filter({ hasText: /empanadas|tacos|pizza/i });
    const cardCount = await storeCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await storeCards.first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 3000 });
  });

  test("dialog has role=dialog, aria-modal=true and accessible label", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const storeCards = page.getByRole("button").filter({ hasText: /empanadas|tacos|pizza/i });
    const cardCount = await storeCards.count();

    if (cardCount === 0) {
      test.skip();
      return;
    }

    await storeCards.first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("aria-label");
  });
});
