import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders children", () => {
    render(<Stack>content</Stack>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    const { container } = render(<Stack>child</Stack>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("renders as specified element via as prop", () => {
    const { container } = render(<Stack as="section">child</Stack>);
    expect(container.firstChild?.nodeName).toBe("SECTION");
  });

  it("applies flex-col class", () => {
    const { container } = render(<Stack>child</Stack>);
    expect(container.firstChild).toHaveClass("flex", "flex-col");
  });

  it("applies gap class when gap prop provided", () => {
    const { container } = render(<Stack gap={4}>child</Stack>);
    expect(container.firstChild).toHaveClass("gap-4");
  });

  it("applies align class when align prop provided", () => {
    const { container } = render(<Stack align="center">child</Stack>);
    expect(container.firstChild).toHaveClass("items-center");
  });

  it("applies justify class when justify prop provided", () => {
    const { container } = render(<Stack justify="between">child</Stack>);
    expect(container.firstChild).toHaveClass("justify-between");
  });

  it("forwards additional className", () => {
    const { container } = render(<Stack className="my-custom">child</Stack>);
    expect(container.firstChild).toHaveClass("my-custom");
  });
});
