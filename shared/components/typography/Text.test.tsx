import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders children", () => {
    render(<Text variant="body">hello</Text>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("forwards className", () => {
    const { container } = render(
      <Text variant="body" className="text-brand">
        content
      </Text>,
    );
    expect(container.firstChild).toHaveClass("text-brand");
  });

  describe("default elements", () => {
    it("display-xl renders as h1", () => {
      const { container } = render(<Text variant="display-xl">t</Text>);
      expect(container.firstChild?.nodeName).toBe("H1");
    });

    it("display-lg renders as h2", () => {
      const { container } = render(<Text variant="display-lg">t</Text>);
      expect(container.firstChild?.nodeName).toBe("H2");
    });

    it("heading-sm renders as h3", () => {
      const { container } = render(<Text variant="heading-sm">t</Text>);
      expect(container.firstChild?.nodeName).toBe("H3");
    });

    it("body renders as p", () => {
      const { container } = render(<Text variant="body">t</Text>);
      expect(container.firstChild?.nodeName).toBe("P");
    });

    it("body-sm renders as p", () => {
      const { container } = render(<Text variant="body-sm">t</Text>);
      expect(container.firstChild?.nodeName).toBe("P");
    });

    it("overline renders as span", () => {
      const { container } = render(<Text variant="overline">t</Text>);
      expect(container.firstChild?.nodeName).toBe("SPAN");
    });

    it("caption renders as span", () => {
      const { container } = render(<Text variant="caption">t</Text>);
      expect(container.firstChild?.nodeName).toBe("SPAN");
    });
  });

  describe("as prop override", () => {
    it("overrides element via as prop", () => {
      const { container } = render(
        <Text variant="body" as="div">
          t
        </Text>,
      );
      expect(container.firstChild?.nodeName).toBe("DIV");
    });

    it("overline can render as p", () => {
      const { container } = render(
        <Text variant="overline" as="p">
          label
        </Text>,
      );
      expect(container.firstChild?.nodeName).toBe("P");
    });
  });

  describe("rest prop forwarding", () => {
    it("forwards data-testid", () => {
      render(
        <Text variant="body" data-testid="my-text">
          content
        </Text>,
      );
      expect(screen.getByTestId("my-text")).toBeInTheDocument();
    });

    it("forwards aria-label", () => {
      render(
        <Text variant="heading-sm" aria-label="section title">
          t
        </Text>,
      );
      expect(screen.getByRole("heading", { name: "section title" })).toBeInTheDocument();
    });
  });

  describe("variant classes", () => {
    it("display-xl applies font-display and font-bold", () => {
      const { container } = render(<Text variant="display-xl">t</Text>);
      expect(container.firstChild).toHaveClass("font-display", "font-bold");
    });

    it("display-xl applies uppercase", () => {
      const { container } = render(<Text variant="display-xl">t</Text>);
      expect(container.firstChild).toHaveClass("uppercase");
    });

    it("display-lg applies font-display and uppercase", () => {
      const { container } = render(<Text variant="display-lg">t</Text>);
      expect(container.firstChild).toHaveClass("font-display", "uppercase");
    });

    it("overline applies font-display, uppercase, and wide tracking", () => {
      const { container } = render(<Text variant="overline">t</Text>);
      expect(container.firstChild).toHaveClass("font-display", "uppercase", "tracking-[0.2em]");
    });

    it("body applies leading-relaxed", () => {
      const { container } = render(<Text variant="body">t</Text>);
      expect(container.firstChild).toHaveClass("leading-relaxed");
    });

    it("body-sm applies text-sm and leading-relaxed", () => {
      const { container } = render(<Text variant="body-sm">t</Text>);
      expect(container.firstChild).toHaveClass("text-sm", "leading-relaxed");
    });

    it("caption applies text-xs", () => {
      const { container } = render(<Text variant="caption">t</Text>);
      expect(container.firstChild).toHaveClass("text-xs");
    });

    it("heading-sm applies font-display and font-bold", () => {
      const { container } = render(<Text variant="heading-sm">t</Text>);
      expect(container.firstChild).toHaveClass("font-display", "font-bold");
    });
  });
});
