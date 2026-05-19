import { config } from "dotenv";
import { resolve } from "path";
import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, statSync } from "fs";

config({ path: resolve(__dirname, "../.env") });
import { E2E_USERS } from "./use-cases/fixtures/users";
import { E2E_STORES } from "./use-cases/fixtures/stores";

const AUTH_DIR = resolve(__dirname, ".auth");

// Stable public UUIDs so store upserts are idempotent across resets.
// Range 50000000-… is reserved for programmatic E2E-only records.
const E2E_ONLY_STORE_IDS = {
  pending: "50000000-0000-0000-0000-000000000001",
  rejected: "50000000-0000-0000-0000-000000000002",
} as const;

// Range 10000000-… is used by seed.sql for the approved store.
const APPROVED_STORE_PUBLIC_ID = "10000000-0000-0000-0000-000000000001";

// Range 40000000-… is reserved for client history orders seeded by global-setup.
const E2E_HISTORY_ORDER_IDS = {
  finalizado: "40000000-0000-0000-0000-000000000001",
  cancelado: "40000000-0000-0000-0000-000000000002",
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

// Products seeded for the approved store — must match seed.sql.
// Upsert in reset ensures they exist even if a previous run deleted them
// (seed uses ON CONFLICT DO NOTHING and won't recreate deleted rows).
const APPROVED_STORE_PRODUCTS = [
  {
    public_id: "20000000-0000-0000-0000-000000000001",
    name: "Choripán simple",
    description: "Pan francés con chorizo criollo",
    price: 1500.0,
  },
  {
    public_id: "20000000-0000-0000-0000-000000000002",
    name: "Choripán con chimichurri",
    description: "Pan artesanal, chorizo y chimichurri casero",
    price: 1800.0,
  },
  {
    public_id: "20000000-0000-0000-0000-000000000003",
    name: "Morcipán",
    description: "Pan con morcilla criolla a la plancha",
    price: 1600.0,
  },
  {
    public_id: "20000000-0000-0000-0000-000000000004",
    name: "Bondiola a la plancha",
    description: "Bondiola de cerdo con mostaza y lechuga",
    price: 2200.0,
  },
] as const;

async function resetApprovedStore(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("[global-setup] SUPABASE_SERVICE_ROLE_KEY is required for test data setup");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { latitude, longitude } = E2E_STORES.approved.geo;
  const { error: storeError } = await supabase
    .from("stores")
    .update({
      available: true,
      validation_status: "approved",
      current_location: `SRID=4326;POINT(${longitude} ${latitude})`,
    })
    .eq("public_id", APPROVED_STORE_PUBLIC_ID);

  if (storeError) {
    throw new Error(`[global-setup] failed to reset approved store: ${storeError.message}`);
  }

  const { data: storeRow, error: storeRowError } = await supabase
    .from("stores")
    .select("id")
    .eq("public_id", APPROVED_STORE_PUBLIC_ID)
    .single();

  if (storeRowError !== null || storeRow === null) {
    throw new Error(`[global-setup] could not fetch store id: ${storeRowError?.message}`);
  }

  const { error: productsError } = await supabase.from("products").upsert(
    APPROVED_STORE_PRODUCTS.map((p) => ({ ...p, store_id: storeRow.id, available: true })),
    { onConflict: "public_id" },
  );

  if (productsError) {
    throw new Error(
      `[global-setup] failed to reset approved store products: ${productsError.message}`,
    );
  }
}

async function seedClientHistoryOrders(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("[global-setup] SUPABASE_SERVICE_ROLE_KEY is required for test data setup");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve bigint IDs from stable UUIDs in seed.sql
  const { data: clientUser, error: clientErr } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", "00000000-0000-0000-0000-000000000001")
    .single();
  if (clientErr ?? !clientUser) {
    throw new Error(`[global-setup] client user not found: ${clientErr?.message}`);
  }

  const { data: approvedStore, error: storeErr } = await supabase
    .from("stores")
    .select("id")
    .eq("public_id", APPROVED_STORE_PUBLIC_ID)
    .single();
  if (storeErr ?? !approvedStore) {
    throw new Error(`[global-setup] approved store not found: ${storeErr?.message}`);
  }

  const now = new Date().toISOString();
  const { data: upsertedOrders, error: ordersErr } = await supabase
    .from("orders")
    .upsert(
      [
        {
          public_id: E2E_HISTORY_ORDER_IDS.finalizado,
          store_id: approvedStore.id,
          customer_id: clientUser.id,
          status: "finalizado",
        },
        {
          public_id: E2E_HISTORY_ORDER_IDS.cancelado,
          store_id: approvedStore.id,
          customer_id: clientUser.id,
          status: "cancelado",
          cancelled_at: now,
          cancel_reason: "Pedido cancelado por el cliente (E2E seed)",
        },
      ],
      { onConflict: "public_id" },
    )
    .select("id, public_id");

  if (ordersErr ?? !upsertedOrders) {
    throw new Error(`[global-setup] failed to upsert history orders: ${ordersErr?.message}`);
  }

  const productSnapshot = {
    name: E2E_STORES.approved.product.name,
    priceArs: E2E_STORES.approved.product.priceArs,
  };

  for (const order of upsertedOrders) {
    await supabase.from("order_items").delete().eq("order_id", order.id);
    const { error: itemsErr } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_snapshot: productSnapshot,
      quantity: 1,
      unit_price: E2E_STORES.approved.product.priceArs,
    });
    if (itemsErr) {
      throw new Error(
        `[global-setup] failed to insert order_items for order ${order.public_id}: ${itemsErr.message}`,
      );
    }
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ?? config.projects[0]?.use.baseURL ?? "http://localhost:3100";

  await seedE2EOnlyUsers();
  await resetApprovedStore();
  await seedClientHistoryOrders();

  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();

  for (const role of ROLES) {
    // Reutilizar sesión si el archivo tiene menos de 1 hora — evita rate limiting de Supabase
    // cuando se corre el suite varias veces seguidas en desarrollo local.
    if (existsSync(role.file) && Date.now() - statSync(role.file).mtimeMs < 60 * 60 * 1000) {
      continue;
    }

    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/correo electrónico/i).fill(role.user.email);
    await page.getByLabel(/contraseña/i).fill(role.user.password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await page.waitForURL(role.waitUrl, { timeout: 30_000, waitUntil: "domcontentloaded" });
    await context.storageState({ path: role.file });
    await context.close();
  }

  await browser.close();
}
