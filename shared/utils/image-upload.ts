export const DEFAULT_MAX_DIMENSION = 1600;
export const DEFAULT_OUTPUT_MIME = "image/jpeg";
export const DEFAULT_QUALITY = 0.85;

export const RESIZABLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const QUALITY_MIN = 0;
const QUALITY_MAX = 1;

const MIME_EXTENSION_MAP: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const FALLBACK_EXTENSION = "img";
const PROCESSING_ERROR_MESSAGE = "No se pudo procesar la imagen. Probá con otro archivo.";

type ResizableImageType = (typeof RESIZABLE_IMAGE_TYPES)[number];

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface CanvasLike {
  readonly width: number;
  readonly height: number;
  readonly drawImage: (source: ImageBitmap, dx: number, dy: number, dw: number, dh: number) => void;
  readonly toBlob: (mimeType: string, quality: number) => Blob | null | Promise<Blob | null>;
}

export interface ResizeImageDeps {
  readonly createImageBitmap?: (data: Blob) => Promise<ImageBitmap>;
  readonly createCanvas?: (width: number, height: number) => CanvasLike;
}

export interface ResizeImageOptions {
  readonly maxDimension?: number;
  readonly mimeType?: string;
  readonly quality?: number;
  readonly deps?: ResizeImageDeps;
}

export interface ResizeImageResult {
  readonly file: File;
  readonly didResize: boolean;
  readonly originalDimensions: ImageDimensions | null;
  readonly outputDimensions: ImageDimensions | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const isResizableImage = (mime: string): mime is ResizableImageType =>
  (RESIZABLE_IMAGE_TYPES as readonly string[]).includes(mime);

const extensionForMime = (mime: string): string => MIME_EXTENSION_MAP[mime] ?? FALLBACK_EXTENSION;

const renameToMime = (originalName: string, mime: string): string => {
  const extension = extensionForMime(mime);
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base}.${extension}`;
};

const computeOutputDimensions = (input: ImageDimensions, maxDimension: number): ImageDimensions => {
  const { width, height } = input;
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const defaultCreateImageBitmap = (data: Blob): Promise<ImageBitmap> => {
  if (typeof globalThis.createImageBitmap !== "function") {
    return Promise.reject(new Error("createImageBitmap no está disponible en este entorno"));
  }
  return globalThis.createImageBitmap(data);
};

const defaultCreateCanvas = (width: number, height: number): CanvasLike => {
  if (typeof document === "undefined") {
    throw new Error("document no está disponible en este entorno");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D no está disponible");
  }
  return {
    width,
    height,
    drawImage: (source, dx, dy, dw, dh) => {
      context.drawImage(source, dx, dy, dw, dh);
    },
    toBlob: (mimeType, quality) =>
      new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), mimeType, quality);
      }),
  };
};

const closeBitmapSafely = (bitmap: ImageBitmap): void => {
  if (typeof bitmap.close === "function") {
    bitmap.close();
  }
};

interface DecodeAndDrawInput {
  readonly file: File;
  readonly originalDimensions: ImageDimensions;
  readonly outputDimensions: ImageDimensions;
  readonly mimeType: string;
  readonly quality: number;
  readonly bitmap: ImageBitmap;
  readonly createCanvas: (width: number, height: number) => CanvasLike;
}

const drawAndExport = async (input: DecodeAndDrawInput): Promise<File> => {
  const { outputDimensions, mimeType, quality, bitmap, createCanvas, file } = input;
  const canvas = createCanvas(outputDimensions.width, outputDimensions.height);
  canvas.drawImage(bitmap, 0, 0, outputDimensions.width, outputDimensions.height);
  const blob = await Promise.resolve(canvas.toBlob(mimeType, quality));
  if (!blob) {
    throw new Error(PROCESSING_ERROR_MESSAGE);
  }
  return new File([blob], renameToMime(file.name, mimeType), {
    type: mimeType,
    lastModified: Date.now(),
  });
};

export const resizeImageForUpload = async (
  file: File,
  options: ResizeImageOptions = {},
): Promise<ResizeImageResult> => {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const mimeType = options.mimeType ?? DEFAULT_OUTPUT_MIME;
  const quality = clamp(options.quality ?? DEFAULT_QUALITY, QUALITY_MIN, QUALITY_MAX);
  const createBitmap = options.deps?.createImageBitmap ?? defaultCreateImageBitmap;
  const createCanvas = options.deps?.createCanvas ?? defaultCreateCanvas;

  if (!isResizableImage(file.type)) {
    return {
      file,
      didResize: false,
      originalDimensions: null,
      outputDimensions: null,
    };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createBitmap(file);
  } catch {
    throw new Error(PROCESSING_ERROR_MESSAGE);
  }

  const originalDimensions: ImageDimensions = { width: bitmap.width, height: bitmap.height };
  const outputDimensions = computeOutputDimensions(originalDimensions, maxDimension);

  if (
    outputDimensions.width === originalDimensions.width &&
    outputDimensions.height === originalDimensions.height
  ) {
    closeBitmapSafely(bitmap);
    return { file, didResize: false, originalDimensions, outputDimensions };
  }

  try {
    const resizedFile = await drawAndExport({
      file,
      originalDimensions,
      outputDimensions,
      mimeType,
      quality,
      bitmap,
      createCanvas,
    });
    return {
      file: resizedFile,
      didResize: true,
      originalDimensions,
      outputDimensions,
    };
  } finally {
    closeBitmapSafely(bitmap);
  }
};
