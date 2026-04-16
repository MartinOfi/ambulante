import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAvailabilityStore } from "@/features/store-shell/stores/availability.store";
import { StoreShellContainer } from "./StoreShell.container";

vi.mock("next/navigation", () => ({
  usePathname: () => "/store/dashboard",
}));

describe("StoreShellContainer", () => {
  beforeEach(() => {
    useAvailabilityStore.setState({ isAvailable: false });
  });

  it("renders children", () => {
    render(
      <StoreShellContainer>
        <div data-testid="content">content</div>
      </StoreShellContainer>,
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("highlights the active route in nav", () => {
    render(
      <StoreShellContainer>
        <span />
      </StoreShellContainer>,
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("bg-accent");
  });

  it("reflects isAvailable=true from store", () => {
    useAvailabilityStore.setState({ isAvailable: true });
    render(
      <StoreShellContainer>
        <span />
      </StoreShellContainer>,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("reflects isAvailable=false from store", () => {
    render(
      <StoreShellContainer>
        <span />
      </StoreShellContainer>,
    );
    expect(screen.getByRole("switch")).not.toBeChecked();
  });
});
