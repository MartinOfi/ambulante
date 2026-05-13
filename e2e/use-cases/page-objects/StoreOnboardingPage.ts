import type { Page } from "@playwright/test";

export class StoreOnboardingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/register/store");
  }

  // ── Paso 1: Datos fiscales ────────────────────────────────────────────────

  get businessNameInput() {
    return this.page.getByRole("textbox", { name: /nombre.*negocio/i });
  }

  get cuitInput() {
    return this.page.getByRole("textbox", { name: /cuit/i });
  }

  async selectKind(kind: string) {
    await this.page.locator("select").selectOption(kind);
  }

  get cuitError() {
    return this.page.getByText(/cuit inválido|dígitos/i);
  }

  // ── Paso 2: Zona de cobertura ─────────────────────────────────────────────

  get neighborhoodInput() {
    return this.page.getByRole("textbox", { name: /barrio/i });
  }

  get coverageNotesInput() {
    return this.page.getByRole("textbox", { name: /notas.*cobertura|zona de operación/i });
  }

  // ── Paso 3: Horarios ──────────────────────────────────────────────────────

  dayCheckbox(day: string) {
    return this.page.getByRole("checkbox", { name: new RegExp(day, "i") });
  }

  get openTimeInput() {
    return this.page.getByLabel(/apertura/i);
  }

  get closeTimeInput() {
    return this.page.getByLabel(/cierre/i);
  }

  get closeBeforeOpenError() {
    return this.page.getByText(/cierre.*posterior.*apertura/i);
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  get nextButton() {
    return this.page.getByRole("button", { name: /siguiente|continuar/i });
  }

  get backButton() {
    return this.page.getByRole("button", { name: /anterior|volver/i });
  }

  get submitButton() {
    return this.page.getByRole("button", { name: /enviar.*solicitud|registrar.*tienda/i });
  }

  get stepIndicator() {
    return this.page.getByRole("navigation", { name: /pasos|progreso/i });
  }

  // ── Post-onboarding ───────────────────────────────────────────────────────

  get pendingApprovalMessage() {
    return this.page.getByText(/solicitud.*revisión|pendiente.*aprobación/i);
  }

  get rejectedMessage() {
    return this.page.getByText(/solicitud.*rechazada/i);
  }

  get rejectionReasonText() {
    return this.page.getByTestId("rejection-reason");
  }
}
