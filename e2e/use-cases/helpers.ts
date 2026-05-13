import type { Page } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users";

// These three functions are no-ops when called from role-specific projects
// (as-client, as-store, as-admin) because the storageState is already injected
// at the project level. They only do the redirect check to confirm the session
// is active before each test body runs.

export async function loginAsClient(page: Page): Promise<void> {
  await page.goto("/map");
  await page.waitForURL("**/map**", { timeout: 10_000 });
}

export async function loginAsStore(page: Page): Promise<void> {
  await page.goto("/store/dashboard");
  await page.waitForURL("**/store/**", { timeout: 10_000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/dashboard");
  await page.waitForURL("**/admin/**", { timeout: 10_000 });
}

// These two roles have no pre-built storageState. Clear any existing session
// (e.g. the store session injected by the as-store project) before logging in.

export async function loginAsStorePending(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(/correo electrónico/i).fill(E2E_USERS.storePending.email);
  await page.getByLabel(/contraseña/i).fill(E2E_USERS.storePending.password);
  await page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
  await page.waitForURL(/\/(store|register)\//, { timeout: 15_000 });
}

export async function loginAsStoreRejected(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(/correo electrónico/i).fill(E2E_USERS.storeRejected.email);
  await page.getByLabel(/contraseña/i).fill(E2E_USERS.storeRejected.password);
  await page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
  await page.waitForURL(/\/(store|register)\//, { timeout: 15_000 });
}
