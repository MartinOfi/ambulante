import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { E2E_STORES } from "./stores";

config({ path: resolve(__dirname, "../../../.env") });

// Stable public UUID for the approved store — must match seed.sql and global-setup.ts
export const APPROVED_STORE_PUBLIC_ID = "10000000-0000-0000-0000-000000000001";

// Products seeded for the approved store — must match seed.sql
// Upsert ensures they exist even if a previous test or manual operation deleted them.
// seed.sql uses ON CONFLICT DO NOTHING so it won't recreate deleted rows.
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

/**
 * Resets the approved store and its products to a known-good state.
 * Call from test.beforeEach in any test that requires the approved store to be open,
 * since the as-store UC-STO-07 test toggles availability and runs in parallel.
 */
export async function resetApprovedStore(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("[e2e] SUPABASE_SERVICE_ROLE_KEY required to reset approved store");
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
    throw new Error(`[e2e] resetApprovedStore (store) failed: ${storeError.message}`);
  }

  const { data: storeRow, error: storeRowError } = await supabase
    .from("stores")
    .select("id")
    .eq("public_id", APPROVED_STORE_PUBLIC_ID)
    .single();

  if (storeRowError !== null || storeRow === null) {
    throw new Error(
      `[e2e] resetApprovedStore: could not fetch store id: ${storeRowError?.message}`,
    );
  }

  const { error: productsError } = await supabase.from("products").upsert(
    APPROVED_STORE_PRODUCTS.map((p) => ({ ...p, store_id: storeRow.id, available: true })),
    { onConflict: "public_id" },
  );

  if (productsError) {
    throw new Error(`[e2e] resetApprovedStore (products) failed: ${productsError.message}`);
  }
}
