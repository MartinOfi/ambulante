import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPrompt } from "./InstallPrompt";
import { INSTALL_PLATFORM } from "./InstallPrompt.types";

describe("InstallPrompt", () => {
  const noopTrigger = vi.fn();
  const noopDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("iOS platform", () => {
    it("renders iOS step-by-step instructions", () => {
      render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.ios}
          isInstalled={false}
          canTriggerNativePrompt={false}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      expect(screen.getByText(/instalar la app/i)).toBeInTheDocument();
      expect(screen.getByTestId("install-prompt-ios-steps")).toBeInTheDocument();
    });

    it("shows share button step for iOS", () => {
      render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.ios}
          isInstalled={false}
          canTriggerNativePrompt={false}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      expect(screen.getByText(/botón compartir/i)).toBeInTheDocument();
      expect(screen.getByText(/agregar a inicio/i)).toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.ios}
          isInstalled={false}
          canTriggerNativePrompt={false}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      await user.click(screen.getByRole("button", { name: /ahora no/i }));
      expect(noopDismiss).toHaveBeenCalledOnce();
    });
  });

  describe("Android platform", () => {
    it("renders native install button when prompt is available", () => {
      render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.android}
          isInstalled={false}
          canTriggerNativePrompt={true}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      expect(screen.getByRole("button", { name: /instalar/i })).toBeInTheDocument();
    });

    it("calls onTriggerNativePrompt when install button clicked", async () => {
      const user = userEvent.setup();
      render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.android}
          isInstalled={false}
          canTriggerNativePrompt={true}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      await user.click(screen.getByRole("button", { name: /instalar/i }));
      expect(noopTrigger).toHaveBeenCalledOnce();
    });
  });

  describe("already installed", () => {
    it("renders nothing when already installed in standalone mode", () => {
      const { container } = render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.android}
          isInstalled={true}
          canTriggerNativePrompt={false}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("unknown/desktop platform", () => {
    it("renders nothing for unknown platform", () => {
      const { container } = render(
        <InstallPrompt
          platform={INSTALL_PLATFORM.unknown}
          isInstalled={false}
          canTriggerNativePrompt={false}
          onTriggerNativePrompt={noopTrigger}
          onDismiss={noopDismiss}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
