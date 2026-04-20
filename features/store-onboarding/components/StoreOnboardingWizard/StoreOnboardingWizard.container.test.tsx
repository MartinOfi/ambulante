import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils";
import { StoreOnboardingWizardContainer } from "./StoreOnboardingWizard.container";
import type { StoreOnboardingService } from "@/features/store-onboarding/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const validService: StoreOnboardingService = {
  submit: vi.fn().mockResolvedValue({ success: true }),
};

const failingService: StoreOnboardingService = {
  submit: vi.fn().mockResolvedValue({ success: false, error: "Error de servidor" }),
};

const throwingService: StoreOnboardingService = {
  submit: vi.fn().mockRejectedValue(new Error("Network error")),
};

function fillAndSubmitFiscal() {
  fireEvent.change(screen.getByPlaceholderText(/El Rincón del Sabor/i), {
    target: { value: "Mi Tienda" },
  });
  fireEvent.change(screen.getByPlaceholderText(/20304050607/i), {
    target: { value: "20304050609" },
  });
  fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
}

function fillAndSubmitZone() {
  fireEvent.change(screen.getByPlaceholderText(/Palermo/i), {
    target: { value: "Palermo" },
  });
  fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
}

describe("StoreOnboardingWizardContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 initially", () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={validService} />);
    expect(screen.getByText("Datos fiscales")).toBeInTheDocument();
    expect(screen.getByText(/Paso 1 de 3/i)).toBeInTheDocument();
  });

  it("advances to step 2 after valid fiscal submission", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={validService} />);
    fillAndSubmitFiscal();
    await waitFor(() => {
      expect(screen.getByText("Zona de operación")).toBeInTheDocument();
    });
  });

  it("advances to step 3 after valid zone submission", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={validService} />);
    fillAndSubmitFiscal();
    await waitFor(() => screen.getByText("Zona de operación"));
    fillAndSubmitZone();
    await waitFor(() => {
      expect(screen.getByText("Horarios")).toBeInTheDocument();
    });
  });

  it("goes back from step 2 to step 1", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={validService} />);
    fillAndSubmitFiscal();
    await waitFor(() => screen.getByText("Zona de operación"));
    fireEvent.click(screen.getByRole("button", { name: /atrás/i }));
    await waitFor(() => {
      expect(screen.getByText("Datos fiscales")).toBeInTheDocument();
    });
  });

  it("calls service.submit and redirects on final step submission", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={validService} />);
    fillAndSubmitFiscal();
    await waitFor(() => screen.getByText("Zona de operación"));
    fillAndSubmitZone();
    await waitFor(() => screen.getByText("Horarios"));

    // Select a day and submit
    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(validService.submit).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/store/pending-approval");
    });
  });

  it("shows server error when service returns failure", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={failingService} />);
    fillAndSubmitFiscal();
    await waitFor(() => screen.getByText("Zona de operación"));
    fillAndSubmitZone();
    await waitFor(() => screen.getByText("Horarios"));

    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Error de servidor");
    });
  });

  it("shows network error and resets isSubmitting when service throws", async () => {
    renderWithProviders(<StoreOnboardingWizardContainer service={throwingService} />);
    fillAndSubmitFiscal();
    await waitFor(() => screen.getByText("Zona de operación"));
    fillAndSubmitZone();
    await waitFor(() => screen.getByText("Horarios"));

    fireEvent.click(screen.getByRole("button", { name: /lun/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Ocurrió un error de red. Intentá de nuevo.",
      );
    });
    expect(screen.getByRole("button", { name: /enviar solicitud/i })).not.toBeDisabled();
  });
});
