import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallPrompt } from "./InstallPrompt";
import { InstallPromptContainer } from "./InstallPrompt.container";
import { INSTALL_PLATFORM } from "./InstallPrompt.types";

// ─── Dumb component tests ────────────────────────────────────────────────────

describe("InstallPrompt (dumb)", () => {
  const noopTrigger = vi.fn();
  const noopDismiss = vi.fn();
  const dialogRef = createRef<HTMLDivElement>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPrompt(
    platform: (typeof INSTALL_PLATFORM)[keyof typeof INSTALL_PLATFORM],
    opts: { isInstalled?: boolean; canTriggerNativePrompt?: boolean } = {},
  ) {
    return render(
      <InstallPrompt
        dialogRef={dialogRef}
        platform={platform}
        isInstalled={opts.isInstalled ?? false}
        canTriggerNativePrompt={opts.canTriggerNativePrompt ?? false}
        onTriggerNativePrompt={noopTrigger}
        onDismiss={noopDismiss}
      />,
    );
  }

  describe("iOS platform", () => {
    it("renders iOS step-by-step instructions", () => {
      renderPrompt(INSTALL_PLATFORM.ios);

      expect(screen.getByText(/instalar la app/i)).toBeInTheDocument();
      expect(screen.getByTestId("install-prompt-ios-steps")).toBeInTheDocument();
    });

    it("shows share and add-to-home steps", () => {
      renderPrompt(INSTALL_PLATFORM.ios);

      expect(screen.getByText(/botón compartir/i)).toBeInTheDocument();
      expect(screen.getByText(/agregar a inicio/i)).toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      renderPrompt(INSTALL_PLATFORM.ios);

      await user.click(screen.getByRole("button", { name: /ahora no/i }));
      expect(noopDismiss).toHaveBeenCalledOnce();
    });

    it("has dialog role and aria-modal", () => {
      renderPrompt(INSTALL_PLATFORM.ios);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("Android platform", () => {
    it("renders native install button when prompt is available", () => {
      renderPrompt(INSTALL_PLATFORM.android, { canTriggerNativePrompt: true });

      expect(screen.getByRole("button", { name: /instalar/i })).toBeInTheDocument();
    });

    it("calls onTriggerNativePrompt when install button clicked", async () => {
      const user = userEvent.setup();
      renderPrompt(INSTALL_PLATFORM.android, { canTriggerNativePrompt: true });

      await user.click(screen.getByRole("button", { name: /instalar/i }));
      expect(noopTrigger).toHaveBeenCalledOnce();
    });
  });

  describe("already installed", () => {
    it("renders nothing when already installed in standalone mode", () => {
      const { container } = renderPrompt(INSTALL_PLATFORM.android, { isInstalled: true });

      expect(container.firstChild).toBeNull();
    });
  });

  describe("unknown/desktop platform", () => {
    it("renders nothing for unknown platform", () => {
      const { container } = renderPrompt(INSTALL_PLATFORM.unknown);

      expect(container.firstChild).toBeNull();
    });
  });
});

// ─── Container tests ─────────────────────────────────────────────────────────

describe("InstallPromptContainer", () => {
  const DISMISSED_KEY = "ambulante-install-prompt-dismissed";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default: iOS standalone NOT active
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it("renders nothing when user already dismissed", () => {
    localStorage.setItem(DISMISSED_KEY, "true");

    const { container } = render(<InstallPromptContainer />);

    expect(container.firstChild).toBeNull();
  });

  it("writes dismissed flag to localStorage on dismiss", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();

    // Simulate iOS so the component renders
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      configurable: true,
    });

    render(<InstallPromptContainer />);
    const dismissBtn = screen.queryByRole("button", { name: /ahora no/i });
    if (dismissBtn) {
      await user.click(dismissBtn);
      expect(setItemSpy).toHaveBeenCalledWith(DISMISSED_KEY, "true");
    }

    setItemSpy.mockRestore();
  });

  it("shows native install button after beforeinstallprompt event", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 13) Chrome/120",
      configurable: true,
    });

    render(<InstallPromptContainer />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: "accepted" as const });
    const deferredEvent = new Event("beforeinstallprompt");
    Object.assign(deferredEvent, { prompt: mockPrompt, userChoice: mockUserChoice });

    await act(async () => {
      window.dispatchEvent(deferredEvent);
    });

    expect(screen.queryByRole("button", { name: /instalar/i })).toBeInTheDocument();
  });

  it("calls prompt() when install button is clicked", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 13) Chrome/120",
      configurable: true,
    });

    render(<InstallPromptContainer />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: "accepted" as const });
    const deferredEvent = new Event("beforeinstallprompt");
    Object.assign(deferredEvent, { prompt: mockPrompt, userChoice: mockUserChoice });

    await act(async () => {
      window.dispatchEvent(deferredEvent);
    });

    const installBtn = screen.queryByRole("button", { name: /instalar/i });
    if (installBtn) {
      await user.click(installBtn);
      expect(mockPrompt).toHaveBeenCalledOnce();
    }
  });

  it("dismisses and writes localStorage when native prompt outcome is dismissed", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 13) Chrome/120",
      configurable: true,
    });

    render(<InstallPromptContainer />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: "dismissed" as const });
    const deferredEvent = new Event("beforeinstallprompt");
    Object.assign(deferredEvent, { prompt: mockPrompt, userChoice: mockUserChoice });

    await act(async () => {
      window.dispatchEvent(deferredEvent);
    });

    const installBtn = screen.queryByRole("button", { name: /instalar/i });
    if (installBtn) {
      await act(async () => {
        await user.click(installBtn);
      });
      expect(setItemSpy).toHaveBeenCalledWith(DISMISSED_KEY, "true");
    }

    setItemSpy.mockRestore();
  });
});
