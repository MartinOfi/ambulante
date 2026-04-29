import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_BUCKETS, STORAGE_SIZE_LIMITS } from "@/shared/constants/storage";

import { createSupabaseStorageService } from "./storage.supabase";
import type { SupabaseStorageBucket, SupabaseStorageClient } from "./storage.supabase";

// ── Test helpers ───────────────────────────────────────────────────────────────

function makeFile(options: { size?: number; type?: string } = {}): File {
  const bytes = new Uint8Array(options.size ?? 100);
  return new File([bytes], "test-file.jpg", { type: options.type ?? "image/jpeg" });
}

function makeBucket(overrides: Partial<SupabaseStorageBucket> = {}): SupabaseStorageBucket {
  return {
    upload: vi.fn().mockResolvedValue({ data: { path: "uploads/test-file.jpg" }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: {
        publicUrl:
          "https://supabase.example.com/storage/v1/object/public/products/uploads/test-file.jpg",
      },
    }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: {
        signedUrl:
          "https://supabase.example.com/storage/v1/object/sign/products/uploads/test-file.jpg?token=abc",
      },
      error: null,
    }),
    remove: vi.fn().mockResolvedValue({ data: [{ name: "test-file.jpg" }], error: null }),
    ...overrides,
  };
}

function makeClient(bucket: SupabaseStorageBucket): SupabaseStorageClient {
  return { from: vi.fn().mockReturnValue(bucket) };
}

// ── upload ─────────────────────────────────────────────────────────────────────

describe("upload", () => {
  let bucket: SupabaseStorageBucket;
  let client: SupabaseStorageClient;

  beforeEach(() => {
    bucket = makeBucket();
    client = makeClient(bucket);
    vi.clearAllMocks();
  });

  it("calls storage.from with the correct bucket", async () => {
    const service = createSupabaseStorageService(client);
    await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/img.jpg",
      file: makeFile(),
    });
    expect(client.from).toHaveBeenCalledWith(STORAGE_BUCKETS.PRODUCTS);
  });

  it("returns success with path and public URL on valid upload", async () => {
    const service = createSupabaseStorageService(client);
    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/img.jpg",
      file: makeFile(),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBe("uploads/test-file.jpg");
      expect(result.data.url).toContain("supabase.example.com");
    }
  });

  it("rejects file that exceeds size limit", async () => {
    const service = createSupabaseStorageService(client);
    const oversized = makeFile({ size: STORAGE_SIZE_LIMITS.PRODUCTS + 1 });

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/big.jpg",
      file: oversized,
    });

    expect(result.success).toBe(false);
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it("rejects file with disallowed MIME type", async () => {
    const service = createSupabaseStorageService(client);
    const exe = makeFile({ type: "application/octet-stream" });

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/virus.exe",
      file: exe,
    });

    expect(result.success).toBe(false);
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it("accepts PDF in validation-docs bucket", async () => {
    const service = createSupabaseStorageService(client);
    const pdf = makeFile({ type: "application/pdf", size: 1024 });

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.VALIDATION_DOCS,
      path: "docs/id.pdf",
      file: pdf,
    });

    expect(result.success).toBe(true);
  });

  it("rejects PDF in products bucket", async () => {
    const service = createSupabaseStorageService(client);
    const pdf = makeFile({ type: "application/pdf", size: 1024 });

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "docs/id.pdf",
      file: pdf,
    });

    expect(result.success).toBe(false);
    expect(bucket.upload).not.toHaveBeenCalled();
  });

  it("returns error when Supabase upload fails", async () => {
    const failBucket = makeBucket({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: "Bucket not found" } }),
    });
    const service = createSupabaseStorageService(makeClient(failBucket));

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/img.jpg",
      file: makeFile(),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("passes contentType option to Supabase upload", async () => {
    const service = createSupabaseStorageService(client);
    const file = makeFile({ type: "image/webp" });

    await service.upload({ bucket: STORAGE_BUCKETS.STORE_LOGOS, path: "logos/logo.webp", file });

    expect(bucket.upload).toHaveBeenCalledWith("logos/logo.webp", file, {
      contentType: "image/webp",
    });
  });

  it("accepts file at exactly the size limit", async () => {
    const service = createSupabaseStorageService(client);
    const exact = makeFile({ size: STORAGE_SIZE_LIMITS.PRODUCTS });

    const result = await service.upload({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      path: "uploads/exact.jpg",
      file: exact,
    });

    expect(result.success).toBe(true);
  });
});

// ── getPublicUrl ───────────────────────────────────────────────────────────────

describe("getPublicUrl", () => {
  it("returns the public URL from Supabase", () => {
    const bucket = makeBucket();
    const service = createSupabaseStorageService(makeClient(bucket));

    const url = service.getPublicUrl({ bucket: STORAGE_BUCKETS.PRODUCTS, path: "uploads/img.jpg" });

    expect(url).toContain("supabase.example.com");
    expect(bucket.getPublicUrl).toHaveBeenCalledWith("uploads/img.jpg");
  });

  it("calls storage.from with correct bucket", () => {
    const bucket = makeBucket();
    const client = makeClient(bucket);
    const service = createSupabaseStorageService(client);

    service.getPublicUrl({ bucket: STORAGE_BUCKETS.STORE_LOGOS, path: "logos/logo.png" });

    expect(client.from).toHaveBeenCalledWith(STORAGE_BUCKETS.STORE_LOGOS);
  });
});

// ── getSignedUrl ───────────────────────────────────────────────────────────────

describe("getSignedUrl", () => {
  it("returns signed URL on success", async () => {
    const bucket = makeBucket();
    const service = createSupabaseStorageService(makeClient(bucket));

    const result = await service.getSignedUrl({
      bucket: STORAGE_BUCKETS.VALIDATION_DOCS,
      path: "docs/id.pdf",
      expiresIn: 3600,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("sign");
    }
    expect(bucket.createSignedUrl).toHaveBeenCalledWith("docs/id.pdf", 3600);
  });

  it("returns error when Supabase fails", async () => {
    const failBucket = makeBucket({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    });
    const service = createSupabaseStorageService(makeClient(failBucket));

    const result = await service.getSignedUrl({
      bucket: STORAGE_BUCKETS.VALIDATION_DOCS,
      path: "docs/missing.pdf",
      expiresIn: 300,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});

// ── remove ─────────────────────────────────────────────────────────────────────

describe("remove", () => {
  it("removes the specified paths and returns success", async () => {
    const bucket = makeBucket();
    const service = createSupabaseStorageService(makeClient(bucket));

    const result = await service.remove({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      paths: ["uploads/a.jpg", "uploads/b.jpg"],
    });

    expect(result.success).toBe(true);
    expect(bucket.remove).toHaveBeenCalledWith(["uploads/a.jpg", "uploads/b.jpg"]);
  });

  it("returns error when Supabase remove fails", async () => {
    const failBucket = makeBucket({
      remove: vi.fn().mockResolvedValue({ data: null, error: { message: "Permission denied" } }),
    });
    const service = createSupabaseStorageService(makeClient(failBucket));

    const result = await service.remove({
      bucket: STORAGE_BUCKETS.PRODUCTS,
      paths: ["uploads/file.jpg"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});
