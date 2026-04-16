import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Screen } from "./Screen";

describe("Screen", () => {
  it("renders children", () => {
    render(<Screen>content</Screen>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    const { container } = render(<Screen>child</Screen>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("applies min-h-screen class", () => {
    const { container } = render(<Screen>child</Screen>);
    expect(container.firstChild).toHaveClass("min-h-screen");
  });

  it("applies overflow-y-auto for scroll", () => {
    const { container } = render(<Screen>child</Screen>);
    expect(container.firstChild).toHaveClass("overflow-y-auto");
  });

  it("renders as main when as prop is main", () => {
    const { container } = render(<Screen as="main">child</Screen>);
    expect(container.firstChild?.nodeName).toBe("MAIN");
  });

  it("forwards additional className", () => {
    const { container } = render(<Screen className="bg-surface">child</Screen>);
    expect(container.firstChild).toHaveClass("bg-surface");
  });
});
