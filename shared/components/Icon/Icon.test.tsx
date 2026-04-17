import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import {
  ICON_COLOR,
  ICON_SIZE,
  ICON_STROKE_WIDTH,
  type IconColor,
  type IconSize,
} from "./Icon.types";

function renderIcon(props: React.ComponentProps<typeof Icon>) {
  return render(<Icon {...props} />);
}

describe("Icon", () => {
  describe("constants", () => {
    it("ICON_SIZE has the expected pixel values", () => {
      expect(ICON_SIZE.xs).toBe(12);
      expect(ICON_SIZE.sm).toBe(16);
      expect(ICON_SIZE.md).toBe(20);
      expect(ICON_SIZE.lg).toBe(24);
      expect(ICON_SIZE.xl).toBe(32);
    });

    it("ICON_COLOR.inherit maps to currentColor", () => {
      expect(ICON_COLOR.inherit).toBe("currentColor");
    });

    it("ICON_COLOR.brand maps to brand-primary CSS var", () => {
      expect(ICON_COLOR.brand).toContain("--brand-primary");
    });

    it("ICON_STROKE_WIDTH is a positive number", () => {
      expect(ICON_STROKE_WIDTH).toBeGreaterThan(0);
    });
  });

  describe("rendering", () => {
    it("shows span fallback before lazy load resolves", () => {
      const { container } = renderIcon({ name: "House" });
      expect(container.querySelector("span, svg")).toBeInTheDocument();
    });

    it("renders the icon after lazy load resolves", async () => {
      renderIcon({ name: "House", "aria-label": "Home" });
      await waitFor(() => {
        expect(screen.getByLabelText("Home")).toBeInTheDocument();
      });
    });

    it("renders an svg element", async () => {
      const { container } = renderIcon({ name: "House", "aria-label": "Home" });
      await waitFor(() => {
        expect(container.querySelector("svg")).toBeInTheDocument();
      });
    });
  });

  describe("size prop", () => {
    it.each(Object.entries(ICON_SIZE) as [IconSize, number][])(
      "applies %s size (%dpx)",
      async (sizeKey, px) => {
        const { container } = renderIcon({ name: "House", size: sizeKey });
        await waitFor(() => {
          const svg = container.querySelector("svg");
          expect(svg).toHaveAttribute("width", String(px));
          expect(svg).toHaveAttribute("height", String(px));
        });
      },
    );

    it("applies md size (20px) by default", async () => {
      const { container } = renderIcon({ name: "House" });
      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg).toHaveAttribute("width", String(ICON_SIZE.md));
        expect(svg).toHaveAttribute("height", String(ICON_SIZE.md));
      });
    });
  });

  describe("color prop", () => {
    // lucide-react maps the `color` prop to the SVG `stroke` attribute
    it.each(Object.entries(ICON_COLOR) as [IconColor, string][])(
      "applies %s color as stroke",
      async (colorKey, colorValue) => {
        const { container } = renderIcon({ name: "House", color: colorKey });
        await waitFor(() => {
          expect(container.querySelector("svg")).toHaveAttribute("stroke", colorValue);
        });
      },
    );

    it("applies currentColor as stroke by default (color=inherit)", async () => {
      const { container } = renderIcon({ name: "House" });
      await waitFor(() => {
        expect(container.querySelector("svg")).toHaveAttribute("stroke", ICON_COLOR.inherit);
      });
    });
  });

  describe("accessibility", () => {
    it("applies aria-label when provided", async () => {
      renderIcon({ name: "House", "aria-label": "Ir al inicio" });
      await waitFor(() => {
        expect(screen.getByLabelText("Ir al inicio")).toBeInTheDocument();
      });
    });

    it("applies aria-hidden when provided", async () => {
      const { container } = renderIcon({ name: "House", "aria-hidden": true });
      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("applies stroke-width from ICON_STROKE_WIDTH constant", async () => {
      const { container } = renderIcon({ name: "House" });
      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg).toHaveAttribute("stroke-width", String(ICON_STROKE_WIDTH));
      });
    });

    it("Suspense fallback span has aria-hidden to avoid screen reader noise", () => {
      const { container } = renderIcon({ name: "House" });
      const span = container.querySelector("span");
      if (span) {
        expect(span).toHaveAttribute("aria-hidden", "true");
      }
    });
  });

  describe("className", () => {
    it("forwards className to the svg", async () => {
      const { container } = renderIcon({
        name: "House",
        className: "custom-class",
      });
      await waitFor(() => {
        const svg = container.querySelector("svg");
        expect(svg).toHaveClass("custom-class");
      });
    });
  });
});
