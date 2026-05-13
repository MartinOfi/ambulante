import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { E2E_USERS } from "./use-cases/fixtures/users";
import { E2E_STORES } from "./use-cases/fixtures/stores";

const AUTH_DIR = resolve(__dirname, ".auth");

// Stable public UUIDs so store upserts are idempotent across resets.
// Range 50000000-… is reserved for programmatic E2E-only records.
const E2E_ONLY_STORE_IDS = {
  pending: "50000000-0000-0000-0000-000000000001",
  rejected: "50000000-0000-0000-0000-000000000002",
} as const;

const ROLES = [
  {
    user: E2E_USERS.client,
    file: resolve(AUTH_DIR, "client.json"),
    waitUrl: "**/map**",
  },
  {
    user: E2E_USERS.store,
    file: resolve(AUTH_DIR, "store.json"),
    waitUrl: "**/store/**",
  },
  {
    user: E2E_USERS.admin,
    file: resolve(AUTH_DIR, "admin.json"),
    waitUrl: "**/admin/**",
  },
] as const;

interface StoreSetupSpec {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly storePublicId: string;
  readonly storeName: string;
  readonly storeCategory: string;
  readonly validationStatus: "pending" | "rejected";
  readonly rejectionReason: string | null;
}

const STORE_SETUP_SPECS: readonly StoreSetupSpec[] = [
  {
    email: E2E_USERS.storePending.email,
    password: E2E_USERS.storePending.password,
    displayName: E2E_STORES.pending.name,
    storePublicId: E2E_ONLY_STORE_IDS.pending,
    storeName: E2E_STORES.pending.name,
    storeCategory: E2E_STORES.pending.kind,
    validationStatus: "pending",
    rejectionReason: null,
  },
  {
    email: E2E_USERS.storeRejected.email,
    password: E2E_USERS.storeRejected.password,
    displayName: E2E_STORES.rejected.name,
    storePublicId: E2E_ONLY_STORE_IDS.rejected,
    storeName: E2E_STORES.rejected.name,
    storeCategory: E2E_STORES.rejected.kind,
    validationStatus: "rejected",
    rejectionReason: E2E_STORES.rejected.rejectionReason,
  },
];

async function seedE2EOnlyUsers(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("[global-setup] SUPABASE_SERVICE_ROLE_KEY is required for test data setup");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const spec of STORE_SETUP_SPECS) {
    // Create auth user — or find the existing one if a previous run already did it.
    let authUserId: string;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: { display_name: spec.displayName, role: "tienda" },
    });

    if (!createError) {
      authUserId = created.user.id;
    } else {
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
      const existing = list?.users.find((u) => u.email === spec.email);
      if (!existing) {
        throw new Error(`[global-setup] cannot find or create auth user: ${spec.email}`);
      }
      authUserId = existing.id;
    }

    // The on_auth_user_created trigger runs synchronously, so public.users
    // already exists by the time createUser() returns.
    const { data: publicUser, error: publicUserError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (publicUserError ?? !publicUser) {
      throw new Error(
        `[global-setup] public.users row not found for ${spec.email}: ${publicUserError?.message}`,
      );
    }

    const { error: storeError } = await supabase.from("stores").upsert(
      {
        public_id: spec.storePublicId,
        owner_id: publicUser.id,
        name: spec.storeName,
        category: spec.storeCategory,
        available: false,
        validation_status: spec.validationStatus,
        rejection_reason: spec.rejectionReason,
      },
      { onConflict: "public_id" },
    );

    if (storeError) {
      throw new Error(
        `[global-setup] failed to upsert store for ${spec.email}: ${storeError.message}`,
      );
    }
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ?? config.projects[0]?.use.baseURL ?? "http://localhost:3100";

  await seedE2EOnlyUsers();

  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const role of ROLES) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto("/login");
    await page.getByLabel(/correo electrónico/i).fill(role.user.email);
    await page.getByLabel(/contraseña/i).fill(role.user.password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await page.waitForURL(role.waitUrl, { timeout: 20_000 });
    await context.storageState({ path: role.file });
    await context.close();
  }

  await browser.close();
}
