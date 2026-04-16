import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StoreShell } from "./StoreShell";

const makeProps = () => ({
  currentPath: "/store/dashboard",
  isAvailable: false,
  onToggleAvailability: vi.fn(),
});

describe("StoreShell", () => {
  it("renders children", () => {
    render(
      <StoreShell {...makeProps()}>
        <div data-testid="child-content">contenido</div>
      </StoreShell>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders navigation", () => {
    render(
      <StoreShell {...makeProps()}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders availability toggle", () => {
    render(
      <StoreShell {...makeProps()}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("passes isAvailable=true to toggle", () => {
    render(
      <StoreShell {...makeProps()} isAvailable={true}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("passes isAvailable=false to toggle", () => {
    render(
      <StoreShell {...makeProps()} isAvailable={false}>
        <span />
      </StoreShell>,
    );
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("calls onToggleAvailability when switch is clicked", async () => {
    const props = makeProps();
    const user = userEvent.setup();
    render(
      <StoreShell {...props}>
        <span />
      </StoreShell>,
    );
    await user.click(screen.getByRole("switch"));
    expect(props.onToggleAvailability).toHaveBeenCalledOnce();
  });
});
