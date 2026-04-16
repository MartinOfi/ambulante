import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Container } from "./Container";

describe("Container", () => {
  it("renders children", () => {
    render(<Container>content</Container>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    const { container } = render(<Container>child</Container>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("applies mx-auto class", () => {
    const { container } = render(<Container>child</Container>);
    expect(container.firstChild).toHaveClass("mx-auto");
  });

  it("applies default md size max-width class", () => {
    const { container } = render(<Container>child</Container>);
    expect(container.firstChild).toHaveClass("max-w-screen-md");
  });

  it("applies xl max-width class when size is xl", () => {
    const { container } = render(<Container size="xl">child</Container>);
    expect(container.firstChild).toHaveClass("max-w-screen-xl");
  });

  it("does not apply max-width when size is full", () => {
    const { container } = render(<Container size="full">child</Container>);
    expect(container.firstChild).not.toHaveClass("max-w-screen-md");
    expect(container.firstChild).not.toHaveClass("max-w-screen-xl");
  });

  it("applies horizontal padding when padded prop provided", () => {
    const { container } = render(<Container padded>child</Container>);
    expect(container.firstChild).toHaveClass("px-4");
  });

  it("renders as main when as prop is main", () => {
    const { container } = render(<Container as="main">child</Container>);
    expect(container.firstChild?.nodeName).toBe("MAIN");
  });
});
