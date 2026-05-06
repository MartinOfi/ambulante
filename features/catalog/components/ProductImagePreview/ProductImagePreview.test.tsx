import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
  }: {
    src: string;
    alt: string;
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
    onError?: React.ReactEventHandler<HTMLImageElement>;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} onLoad={onLoad} onError={onError} />, // eslint-disable-line @next/next/no-img-element
}));

import { ProductImagePreview } from "./ProductImagePreview";

const SRC = "https://example.com/photo.jpg";

describe("ProductImagePreview", () => {
  it("renders an img with the correct src", () => {
    render(<ProductImagePreview src={SRC} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", SRC);
  });

  it("uses default alt text when altText is not provided", () => {
    render(<ProductImagePreview src={SRC} />);
    expect(screen.getByAltText(/vista previa del producto/i)).toBeInTheDocument();
  });

  it("uses custom altText when provided", () => {
    render(<ProductImagePreview src={SRC} altText="Mi foto" />);
    expect(screen.getByAltText("Mi foto")).toBeInTheDocument();
  });

  it("shows loading skeleton before image loads", () => {
    const { container } = render(<ProductImagePreview src={SRC} />);
    const skeleton = container.querySelector("[aria-hidden]");
    expect(skeleton).toBeInTheDocument();
  });

  it("hides skeleton after image loads", () => {
    const { container } = render(<ProductImagePreview src={SRC} />);
    fireEvent.load(screen.getByRole("img"));
    expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument();
  });

  it("shows error state when image fails to load", () => {
    render(<ProductImagePreview src={SRC} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("alert")).toHaveTextContent(/imagen no disponible/i);
  });

  it("calls onError callback when image fails to load", () => {
    const onError = vi.fn();
    render(<ProductImagePreview src={SRC} onError={onError} />);
    fireEvent.error(screen.getByRole("img"));
    expect(onError).toHaveBeenCalledOnce();
  });

  it("resets to loading state when src changes", () => {
    const { rerender, container } = render(<ProductImagePreview src={SRC} />);
    fireEvent.load(screen.getByRole("img"));
    expect(container.querySelector("[aria-hidden]")).not.toBeInTheDocument();

    rerender(<ProductImagePreview src="https://example.com/other.jpg" />);
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();
  });
});
