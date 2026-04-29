import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { VALIDATION_DOC_TYPES } from "@/features/store-validation/constants";
import { ValidationDocViewer } from "./ValidationDocViewer";

const BASE_PROPS = {
  docType: VALIDATION_DOC_TYPES.ID_FRONT,
  label: "DNI / Cédula (frente)",
  url: null,
  mimeType: null,
  filename: null,
  isLoading: false,
  errorMessage: null,
} as const;

describe("ValidationDocViewer", () => {
  it("renders the label as a heading", () => {
    render(<ValidationDocViewer {...BASE_PROPS} />);
    expect(screen.getByRole("heading", { name: "DNI / Cédula (frente)" })).toBeInTheDocument();
  });

  it("shows a loading skeleton while loading", () => {
    render(<ValidationDocViewer {...BASE_PROPS} isLoading />);
    expect(screen.getByTestId("validation-doc-id_front-loading")).toBeInTheDocument();
  });

  it("shows an error message when errorMessage is provided", () => {
    render(<ValidationDocViewer {...BASE_PROPS} errorMessage="Object not found" />);
    const node = screen.getByTestId("validation-doc-id_front-error");
    expect(node).toHaveTextContent(/Object not found/);
    expect(node).toHaveAttribute("role", "alert");
  });

  it("shows an empty state when url is null and not loading", () => {
    render(<ValidationDocViewer {...BASE_PROPS} />);
    expect(screen.getByTestId("validation-doc-id_front-empty")).toBeInTheDocument();
  });

  it("renders an iframe when mime type is application/pdf", () => {
    render(
      <ValidationDocViewer
        {...BASE_PROPS}
        url="https://signed.example.com/file.pdf"
        mimeType="application/pdf"
        filename="habilitacion.pdf"
      />,
    );
    const iframe = screen.getByTestId("validation-doc-id_front-pdf");
    expect(iframe).toHaveAttribute("src", "https://signed.example.com/file.pdf");
    expect(iframe.tagName).toBe("IFRAME");
  });

  it("renders an image container when mime type is an image", () => {
    render(
      <ValidationDocViewer
        {...BASE_PROPS}
        url="https://signed.example.com/file.jpg"
        mimeType="image/jpeg"
        filename="frente.jpg"
      />,
    );
    expect(screen.getByTestId("validation-doc-id_front-image")).toBeInTheDocument();
    expect(screen.getByAltText("DNI / Cédula (frente)")).toBeInTheDocument();
  });

  it("displays filename when provided", () => {
    render(<ValidationDocViewer {...BASE_PROPS} filename="dni-frente.jpg" />);
    expect(screen.getByText("dni-frente.jpg")).toBeInTheDocument();
  });

  it("renders an error when url is non-null but mimeType is null", () => {
    render(
      <ValidationDocViewer {...BASE_PROPS} url="https://signed.example.com/file" mimeType={null} />,
    );
    expect(screen.getByTestId("validation-doc-id_front-error")).toHaveTextContent(
      /No se pudo determinar el tipo/,
    );
  });
});
