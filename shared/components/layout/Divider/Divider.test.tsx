import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders an hr element", () => {
    const { container } = render(<Divider />);
    expect(container.firstChild?.nodeName).toBe("HR");
  });

  it("applies border-t class by default (horizontal)", () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toHaveClass("border-t");
  });

  it("applies border-l class when orientation is vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    expect(container.firstChild).toHaveClass("border-l");
  });

  it("does not apply border-t when orientation is vertical", () => {
    const { container } = render(<Divider orientation="vertical" />);
    expect(container.firstChild).not.toHaveClass("border-t");
  });

  it("applies border-border color class", () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toHaveClass("border-border");
  });

  it("forwards additional className", () => {
    const { container } = render(<Divider className="my-4" />);
    expect(container.firstChild).toHaveClass("my-4");
  });
});
