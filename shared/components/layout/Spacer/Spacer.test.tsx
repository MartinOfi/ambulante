import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spacer } from "./Spacer";

describe("Spacer", () => {
  it("renders a div", () => {
    const { container } = render(<Spacer size={4} />);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("applies aria-hidden for accessibility", () => {
    const { container } = render(<Spacer size={4} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("applies vertical height class by default", () => {
    const { container } = render(<Spacer size={4} />);
    expect(container.firstChild).toHaveClass("h-4");
  });

  it("applies horizontal width class when axis is horizontal", () => {
    const { container } = render(<Spacer size={8} axis="horizontal" />);
    expect(container.firstChild).toHaveClass("w-8");
  });

  it("does not apply width class on vertical spacer", () => {
    const { container } = render(<Spacer size={4} />);
    expect(container.firstChild).not.toHaveClass("w-4");
  });
});
