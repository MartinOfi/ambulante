import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/services/storage", () => ({
  storageService: {
    upload: vi.fn(),
  },
}));

vi.mock("@/shared/utils/image-upload", () => ({
  resizeImageForUpload: vi.fn(),
}));

import { storageService } from "@/shared/services/storage";
import { resizeImageForUpload } from "@/shared/utils/image-upload";
import { ProductImageUploadContainer } from "./ProductImageUpload.container";

const MOCK_URL = "https://mock-storage.ambulante.local/products/abc.jpg";

function makeFile(type = "image/jpeg", size = 1024): File {
  return new File(["x".repeat(size)], "photo.jpg", { type });
}

describe("ProductImageUploadContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resizeImageForUpload).mockResolvedValue({
      file: makeFile(),
      didResize: false,
      originalDimensions: { width: 800, height: 600 },
      outputDimensions: { width: 800, height: 600 },
    });
    vi.mocked(storageService.upload).mockResolvedValue({
      success: true,
      data: { path: "products/abc.jpg", url: MOCK_URL },
    });
  });

  it("renders upload button when no image", () => {
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);
    expect(screen.getByRole("button", { name: /subir imagen/i })).toBeInTheDocument();
  });

  it("renders change button and preview when currentUrl provided", () => {
    render(<ProductImageUploadContainer currentUrl={MOCK_URL} onUploaded={vi.fn()} />);
    expect(screen.getByRole("button", { name: /cambiar imagen/i })).toBeInTheDocument();
    expect(screen.getByAltText(/vista previa/i)).toBeInTheDocument();
  });

  it("calls onUploaded with the returned URL on success", async () => {
    const onUploaded = vi.fn();
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={onUploaded} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(MOCK_URL));
  });

  it("shows error when file type is not allowed", async () => {
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile("application/pdf")] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/formato no soportado/i);
    expect(storageService.upload).not.toHaveBeenCalled();
  });

  it("shows error when file exceeds 5 MB limit", async () => {
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);

    const bigFile = makeFile("image/jpeg", 6 * 1024 * 1024);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/5 mb/i);
    expect(storageService.upload).not.toHaveBeenCalled();
  });

  it("shows error when upload fails", async () => {
    vi.mocked(storageService.upload).mockResolvedValue({
      success: false,
      error: "Server error",
    });

    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/no se pudo subir/i);
  });

  it("disables button while uploading", async () => {
    vi.mocked(storageService.upload).mockReturnValue(new Promise(() => {}));

    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
