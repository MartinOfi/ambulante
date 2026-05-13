import type { Page } from "@playwright/test";

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async gotoClient() {
    await this.page.goto("/register");
  }

  async gotoStore() {
    await this.page.goto("/register/store");
  }

  async fillEmail(email: string) {
    await this.page.getByRole("textbox", { name: /correo electrónico|email/i }).fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/^contraseña$/i).fill(password);
  }

  async fillPasswordConfirm(password: string) {
    await this.page.getByLabel(/confirmar contraseña|repetir/i).fill(password);
  }

  async fillName(name: string) {
    await this.page.getByRole("textbox", { name: /nombre/i }).fill(name);
  }

  async submit() {
    await this.page.getByRole("button", { name: /crear cuenta|registrarse/i }).click();
  }

  get emailError() {
    return this.page.getByText(/email válido/i);
  }

  get passwordMismatchError() {
    return this.page.getByText(/contraseñas.*no coinciden/i);
  }

  get successMessage() {
    return this.page.getByText(/revisá tu email|confirmación.*enviada/i);
  }
}
