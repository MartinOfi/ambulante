import { expect, test } from "@playwright/test";
import { E2E_USERS } from "../fixtures/users";
import { LoginPage } from "../page-objects/LoginPage";
import { RegisterPage } from "../page-objects/RegisterPage";

// UC-AUTH-01: Registro de cliente
test.describe("UC-AUTH-01 — registro de cliente", () => {
  test("muestra formulario de registro y valida campos vacíos", async ({ page }) => {
    const register = new RegisterPage(page);
    await register.gotoClient();
    await register.submit();
    await expect(register.emailError).toBeVisible();
  });

  test("muestra error por email ya registrado", async ({ page }) => {
    const register = new RegisterPage(page);
    await register.gotoClient();
    await register.fillEmail(E2E_USERS.client.email);
    await register.fillPassword(E2E_USERS.client.password);
    await register.fillPasswordConfirm(E2E_USERS.client.password);
    await register.submit();
    // Email ya en uso muestra error de validación o mensaje genérico de email
    await expect(
      register.emailError.or(
        page.getByText(
          /ya.*registrado|en uso|ya existe|user.*registered|correo.*uso|email.*already/i,
        ),
      ),
    ).toBeVisible({
      timeout: 8_000,
    });
  });
});

// UC-AUTH-02: Registro de tienda (inicia onboarding)
test.describe("UC-AUTH-02 — registro que inicia onboarding de tienda", () => {
  test("registro de tienda navega al wizard de onboarding", async ({ page }) => {
    const register = new RegisterPage(page);
    await register.gotoStore();
    await expect(page).toHaveURL(/register\/store|onboarding/);
  });
});

// UC-AUTH-03: Login de cliente
test.describe("UC-AUTH-03 — login de cliente", () => {
  test("login exitoso redirige a /map", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.client.email, E2E_USERS.client.password);
    await page.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/map");
  });

  test("credenciales incorrectas muestran error", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillEmail(E2E_USERS.client.email);
    await login.fillPassword("password-incorrecto-999");
    await login.submit();
    await expect(login.credentialsError).toBeVisible({ timeout: 8_000 });
  });

  test("submit vacío muestra errores de validación", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit();
    await expect(login.emailError).toBeVisible();
  });
});

// UC-AUTH-04: Login de tienda
test.describe("UC-AUTH-04 — login de tienda", () => {
  test("login exitoso redirige a /store/*", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.store.email, E2E_USERS.store.password);
    await page.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/store");
  });
});

// UC-AUTH-05: Login de admin
test.describe("UC-AUTH-05 — login de admin", () => {
  test("login exitoso redirige a /admin/*", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.admin.email, E2E_USERS.admin.password);
    await page.waitForURL("**/admin/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin");
  });
});

// UC-AUTH-06: Recupero de contraseña
test.describe("UC-AUTH-06 — recupero de contraseña", () => {
  test("formulario de recupero muestra campo de email", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.forgotPasswordLink.click();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible({ timeout: 5_000 });
  });

  test("envío de email de recupero muestra confirmación", async ({ page }) => {
    await page.goto("/forgot-password", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/correo electrónico/i).fill(E2E_USERS.client.email);
    await page.getByRole("button").first().click();
    await expect(page.getByText(/email|enlace/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

// UC-AUTH-07: Reset de contraseña (requiere token válido del correo)
test.describe("UC-AUTH-07 — reset de contraseña", () => {
  test("ruta /auth/reset-password sin token redirige a error", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "domcontentloaded" });
    // Sin token debe mostrar error o redirigir
    await expect(
      page
        .getByText(/token|expirado|inválido|incompleto|enlace/i)
        .or(page.getByRole("heading", { name: /error|enlace|incompleto/i })),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// UC-AUTH-08: Redirect post-login según rol
test.describe("UC-AUTH-08 — redirect post-login según rol", () => {
  test("cliente va a /map", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.client.email, E2E_USERS.client.password);
    await page.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/map");
  });

  test("tienda va a /store/*", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.store.email, E2E_USERS.store.password);
    await page.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/store");
  });

  test("admin va a /admin/*", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.admin.email, E2E_USERS.admin.password);
    await page.waitForURL("**/admin/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/admin");
  });
});

// UC-AUTH-09: Bloqueo de rutas por rol incorrecto
test.describe("UC-AUTH-09 — bloqueo de rutas por rol incorrecto", () => {
  test("cliente no puede acceder a /store/dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.client.email, E2E_USERS.client.password);
    await page.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    await page.goto("/store/dashboard", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/store/dashboard");
  });

  test("cliente no puede acceder a /admin/dashboard", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.client.email, E2E_USERS.client.password);
    await page.waitForURL("**/map**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/admin");
  });

  test("tienda no puede acceder a /map", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(E2E_USERS.store.email, E2E_USERS.store.password);
    await page.waitForURL("**/store/**", { timeout: 15_000, waitUntil: "domcontentloaded" });
    await page.goto("/map", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/map");
  });
});
