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
  const file = new File(["x"], "photo.jpg", { type });
  if (size !== 1) {
    // Stub size to avoid allocating large buffers in jsdom
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
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
      expect(screen.getByRole("button", { name: /subiendo/i })).toBeDisabled();
    });
  });

  it("shows immediate blob preview when file is selected", async () => {
    const objectUrl = "blob:http://localhost/abc-123";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => objectUrl),
      revokeObjectURL: vi.fn(),
    });
    vi.mocked(storageService.upload).mockReturnValue(new Promise(() => {}));

    render(<ProductImageUploadContainer currentUrl={null} onUploaded={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => {
      expect(screen.getByAltText(/vista previa/i)).toHaveAttribute("src", objectUrl);
    });

    vi.unstubAllGlobals();
  });

  it("replaces blob preview with storage URL after successful upload", async () => {
    const objectUrl = "blob:http://localhost/abc-123";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => objectUrl),
      revokeObjectURL: vi.fn(),
    });

    const onUploaded = vi.fn();
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={onUploaded} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(MOCK_URL));

    expect(screen.getByAltText(/vista previa/i)).toHaveAttribute("src", MOCK_URL);

    vi.unstubAllGlobals();
  });

  it("sets preview and calls onUploaded when URL is committed via Enter", () => {
    const onUploaded = vi.fn();
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={onUploaded} />);

    const urlInput = screen.getByRole("textbox", { name: /url de imagen/i });
    fireEvent.change(urlInput, { target: { value: "https://example.com/photo.jpg" } });
    fireEvent.keyDown(urlInput, { key: "Enter" });

    expect(onUploaded).toHaveBeenCalledWith("https://example.com/photo.jpg");
    expect(screen.getByAltText(/vista previa/i)).toHaveAttribute(
      "src",
      "https://example.com/photo.jpg",
    );
  });

  it("sets preview and calls onUploaded when URL input loses focus", () => {
    const onUploaded = vi.fn();
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={onUploaded} />);

    const urlInput = screen.getByRole("textbox", { name: /url de imagen/i });
    fireEvent.change(urlInput, { target: { value: "https://example.com/photo.jpg" } });
    fireEvent.blur(urlInput);

    expect(onUploaded).toHaveBeenCalledWith("https://example.com/photo.jpg");
  });

  it("ignores empty URL on commit", () => {
    const onUploaded = vi.fn();
    render(<ProductImageUploadContainer currentUrl={null} onUploaded={onUploaded} />);

    const urlInput = screen.getByRole("textbox", { name: /url de imagen/i });
    fireEvent.change(urlInput, { target: { value: "   " } });
    fireEvent.blur(urlInput);

    expect(onUploaded).not.toHaveBeenCalled();
  });
});
