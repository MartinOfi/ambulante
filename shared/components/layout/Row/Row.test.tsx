import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Row } from "./Row";

describe("Row", () => {
  it("renders children", () => {
    render(<Row>content</Row>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    const { container } = render(<Row>child</Row>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("renders as specified element via as prop", () => {
    const { container } = render(<Row as="nav">child</Row>);
    expect(container.firstChild?.nodeName).toBe("NAV");
  });

  it("applies flex-row classes", () => {
    const { container } = render(<Row>child</Row>);
    expect(container.firstChild).toHaveClass("flex", "flex-row");
  });

  it("applies gap class when gap prop provided", () => {
    const { container } = render(<Row gap={2}>child</Row>);
    expect(container.firstChild).toHaveClass("gap-2");
  });

  it("applies wrap class when wrap prop is true", () => {
    const { container } = render(<Row wrap>child</Row>);
    expect(container.firstChild).toHaveClass("flex-wrap");
  });

  it("does not apply wrap class by default", () => {
    const { container } = render(<Row>child</Row>);
    expect(container.firstChild).not.toHaveClass("flex-wrap");
  });

  it("applies align-items class", () => {
    const { container } = render(<Row align="start">child</Row>);
    expect(container.firstChild).toHaveClass("items-start");
  });

  it("forwards additional className", () => {
    const { container } = render(<Row className="extra">child</Row>);
    expect(container.firstChild).toHaveClass("extra");
  });
});
