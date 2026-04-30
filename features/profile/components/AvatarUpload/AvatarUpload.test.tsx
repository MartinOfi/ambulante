import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { AvatarUpload } from "./AvatarUpload";

const baseProps = {
  isPending: false,
  onFileSelected: vi.fn(),
};

function makeFile(name = "x.jpg", type = "image/jpeg", size = 1000): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("AvatarUpload", () => {
  it("muestra placeholder cuando no hay currentUrl", () => {
    render(<AvatarUpload {...baseProps} />);
    expect(screen.queryByAltText(/avatar actual/i)).not.toBeInTheDocument();
  });

  it("muestra <img> cuando hay currentUrl", () => {
    render(<AvatarUpload {...baseProps} currentUrl="https://example.com/a.jpg" />);
    const img = screen.getByAltText(/avatar actual/i) as HTMLImageElement;
    expect(img.src).toBe("https://example.com/a.jpg");
  });

  it("invoca onFileSelected cuando el usuario elige archivo", () => {
    const onFileSelected = vi.fn();
    render(<AvatarUpload {...baseProps} onFileSelected={onFileSelected} />);
    const input = screen.getByLabelText(/foto de perfil/i) as HTMLInputElement;
    const file = makeFile();
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it("limpia el value del input después de seleccionar para permitir re-seleccionar el mismo archivo", () => {
    const onFileSelected = vi.fn();
    render(<AvatarUpload {...baseProps} onFileSelected={onFileSelected} />);
    const input = screen.getByLabelText(/foto de perfil/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });
    expect(input.value).toBe("");
  });

  it("botón disabled durante isPending", () => {
    render(<AvatarUpload {...baseProps} isPending />);
    expect(screen.getByRole("button", { name: /subiendo/i })).toBeDisabled();
  });

  it("muestra errorMessage cuando se pasa", () => {
    render(<AvatarUpload {...baseProps} errorMessage="Demasiado grande" />);
    expect(screen.getByText("Demasiado grande")).toBeInTheDocument();
  });
});
