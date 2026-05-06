import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MAX_DIMENSION,
  DEFAULT_OUTPUT_MIME,
  DEFAULT_QUALITY,
  RESIZABLE_IMAGE_TYPES,
  resizeImageForUpload,
} from "./image-upload";
import type { ResizeImageDeps, ResizeImageOptions } from "./image-upload";

interface FakeBitmap {
  readonly width: number;
  readonly height: number;
  readonly close: () => void;
}

interface FakeCanvas {
  readonly width: number;
  readonly height: number;
  readonly toBlob: (mime: string, quality: number) => Blob;
}

interface DepsHarness {
  readonly deps: ResizeImageDeps;
  readonly bitmaps: readonly FakeBitmap[];
  readonly canvases: readonly FakeCanvas[];
  readonly closeSpy: ReturnType<typeof vi.fn>;
}

const PNG_MIME = "image/png";
const PDF_MIME = "application/pdf";

const buildFile = (size: number, type: string, name = "photo.png"): File => {
  const buffer = new Uint8Array(size).fill(1);
  return new File([buffer], name, { type, lastModified: 1_700_000_000_000 });
};

const buildHarness = (params: {
  readonly width: number;
  readonly height: number;
  readonly outputBlobSize?: number;
}): DepsHarness => {
  const closeSpy = vi.fn();
  const bitmap: FakeBitmap = {
    width: params.width,
    height: params.height,
    close: closeSpy,
  };

  const canvases: FakeCanvas[] = [];
  const blobSize = params.outputBlobSize ?? 100;

  const deps: ResizeImageDeps = {
    createImageBitmap: vi.fn(async () => bitmap as unknown as ImageBitmap),
    createCanvas: vi.fn((width: number, height: number) => {
      const canvas: FakeCanvas = {
        width,
        height,
        toBlob: (mime: string) => new Blob([new Uint8Array(blobSize)], { type: mime }),
      };
      canvases.push(canvas);
      return {
        width,
        height,
        drawImage: () => undefined,
        toBlob: canvas.toBlob,
      };
    }),
  };

  return { deps, bitmaps: [bitmap], canvases, closeSpy };
};

describe("resizeImageForUpload — defaults", () => {
  it("expone constantes públicas con valores esperados", () => {
    expect(DEFAULT_MAX_DIMENSION).toBe(1600);
    expect(DEFAULT_OUTPUT_MIME).toBe("image/jpeg");
    expect(DEFAULT_QUALITY).toBe(0.85);
    expect(RESIZABLE_IMAGE_TYPES).toContain("image/jpeg");
    expect(RESIZABLE_IMAGE_TYPES).toContain("image/png");
    expect(RESIZABLE_IMAGE_TYPES).toContain("image/webp");
    expect(RESIZABLE_IMAGE_TYPES).toContain("image/gif");
  });
});

describe("resizeImageForUpload — no-op paths", () => {
  it("retorna el archivo original si ambas dimensiones están dentro del max", async () => {
    const file = buildFile(1024, PNG_MIME);
    const { deps } = buildHarness({ width: 800, height: 600 });

    const result = await resizeImageForUpload(file, { deps });

    expect(result.didResize).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalDimensions).toEqual({ width: 800, height: 600 });
    expect(result.outputDimensions).toEqual({ width: 800, height: 600 });
  });

  it("retorna el archivo original si el MIME no es redimensionable (pdf)", async () => {
    const file = buildFile(2048, PDF_MIME, "doc.pdf");
    const harness = buildHarness({ width: 9999, height: 9999 });

    const result = await resizeImageForUpload(file, { deps: harness.deps });

    expect(result.didResize).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalDimensions).toBeNull();
    expect(result.outputDimensions).toBeNull();
    expect(harness.deps.createImageBitmap).not.toHaveBeenCalled();
  });
});

describe("resizeImageForUpload — resize paths", () => {
  it("redimensiona horizontalmente preservando aspect ratio", async () => {
    const file = buildFile(8 * 1024 * 1024, PNG_MIME);
    const harness = buildHarness({ width: 3200, height: 1600 });

    const result = await resizeImageForUpload(file, { deps: harness.deps });

    expect(result.didResize).toBe(true);
    expect(result.originalDimensions).toEqual({ width: 3200, height: 1600 });
    expect(result.outputDimensions).toEqual({ width: 1600, height: 800 });
    expect(result.file).not.toBe(file);
    expect(result.file.type).toBe(DEFAULT_OUTPUT_MIME);
    expect(harness.canvases).toHaveLength(1);
    expect(harness.canvases[0]?.width).toBe(1600);
    expect(harness.canvases[0]?.height).toBe(800);
  });

  it("redimensiona verticalmente preservando aspect ratio", async () => {
    const file = buildFile(8 * 1024 * 1024, PNG_MIME);
    const harness = buildHarness({ width: 1000, height: 4000 });

    const result = await resizeImageForUpload(file, { deps: harness.deps });

    expect(result.didResize).toBe(true);
    expect(result.outputDimensions).toEqual({ width: 400, height: 1600 });
  });

  it("respeta maxDimension custom", async () => {
    const file = buildFile(2048, PNG_MIME);
    const harness = buildHarness({ width: 2000, height: 1000 });

    const result = await resizeImageForUpload(file, {
      deps: harness.deps,
      maxDimension: 800,
    });

    expect(result.outputDimensions).toEqual({ width: 800, height: 400 });
  });

  it("respeta mimeType y quality custom", async () => {
    const file = buildFile(2048, PNG_MIME);
    const harness = buildHarness({ width: 3000, height: 2000 });
    const toBlobSpy = vi.fn((mime: string) => new Blob([new Uint8Array(50)], { type: mime }));

    const customDeps: ResizeImageDeps = {
      ...harness.deps,
      createCanvas: (width: number, height: number) => ({
        width,
        height,
        drawImage: () => undefined,
        toBlob: toBlobSpy,
      }),
    };
    const options: ResizeImageOptions = {
      deps: customDeps,
      mimeType: "image/webp",
      quality: 0.6,
    };

    const result = await resizeImageForUpload(file, options);

    expect(result.file.type).toBe("image/webp");
    expect(toBlobSpy).toHaveBeenCalledWith("image/webp", 0.6);
  });

  it("cierra el ImageBitmap después de dibujar", async () => {
    const file = buildFile(2048, PNG_MIME);
    const harness = buildHarness({ width: 3000, height: 1500 });

    await resizeImageForUpload(file, { deps: harness.deps });

    expect(harness.closeSpy).toHaveBeenCalledTimes(1);
  });

  it("no falla si el ImageBitmap no expone close()", async () => {
    const file = buildFile(2048, PNG_MIME);
    const bitmapWithoutClose = { width: 3000, height: 1500 } as unknown as ImageBitmap;
    const deps: ResizeImageDeps = {
      createImageBitmap: vi.fn(async () => bitmapWithoutClose),
      createCanvas: () => ({
        width: 0,
        height: 0,
        drawImage: () => undefined,
        toBlob: (mime: string) => new Blob([new Uint8Array(10)], { type: mime }),
      }),
    };

    const result = await resizeImageForUpload(file, { deps });

    expect(result.didResize).toBe(true);
  });

  it("preserva el nombre del archivo original al renombrar a la extensión nueva", async () => {
    const file = buildFile(2048, PNG_MIME, "mi-foto.png");
    const harness = buildHarness({ width: 3000, height: 2000 });

    const result = await resizeImageForUpload(file, { deps: harness.deps });

    expect(result.file.name).toBe("mi-foto.jpg");
  });
});

describe("resizeImageForUpload — error handling", () => {
  it("lanza error con mensaje legible si createImageBitmap falla", async () => {
    const file = buildFile(2048, PNG_MIME);
    const failingDeps: ResizeImageDeps = {
      createImageBitmap: vi.fn(async () => {
        throw new Error("decode failed");
      }),
      createCanvas: vi.fn(),
    };

    await expect(resizeImageForUpload(file, { deps: failingDeps })).rejects.toThrow(
      /No se pudo procesar la imagen/,
    );
  });

  it("lanza error si el blob resultante es null", async () => {
    const file = buildFile(2048, PNG_MIME);
    const harness = buildHarness({ width: 3000, height: 1500 });
    const nullBlobDeps: ResizeImageDeps = {
      ...harness.deps,
      createCanvas: () => ({
        width: 0,
        height: 0,
        drawImage: () => undefined,
        toBlob: () => null,
      }),
    };

    await expect(resizeImageForUpload(file, { deps: nullBlobDeps })).rejects.toThrow(
      /No se pudo procesar la imagen/,
    );
  });

  it("clampa quality a [0, 1]", async () => {
    const file = buildFile(2048, PNG_MIME);
    const toBlobSpy = vi.fn((mime: string) => new Blob([new Uint8Array(10)], { type: mime }));
    const deps: ResizeImageDeps = {
      createImageBitmap: vi.fn(
        async () =>
          ({ width: 3000, height: 2000, close: () => undefined }) as unknown as ImageBitmap,
      ),
      createCanvas: () => ({
        width: 0,
        height: 0,
        drawImage: () => undefined,
        toBlob: toBlobSpy,
      }),
    };

    await resizeImageForUpload(file, { deps, quality: 5 });

    expect(toBlobSpy).toHaveBeenCalledWith(expect.any(String), 1);
  });
});
