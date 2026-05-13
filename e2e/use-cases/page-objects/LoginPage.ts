import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async fillEmail(email: string) {
    await this.page.getByRole("textbox", { name: /correo electrónico|email/i }).fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/contraseña/i).fill(password);
  }

  async submit() {
    await this.page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
  }

  async loginAs(email: string, password: string) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  get emailError() {
    return this.page.getByText(/email.*requerido|ingresá.*email/i);
  }

  get passwordError() {
    return this.page.getByText(/contraseña.*requerida|ingresá.*contraseña/i);
  }

  get credentialsError() {
    return this.page.getByText(/credenciales inválidas/i);
  }

  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /olvidaste.*contraseña|recuperar/i });
  }

  get registerLink() {
    return this.page.getByRole("link", { name: /crear cuenta|registrarse/i });
  }
}
