// Fixed UUIDs for mock seeding — ensures findByOwnerId() works deterministically across
// the lifetime of a dev server process. store2/store3 are extra store-role users to keep
// seed store ownership semantically correct (clients/admins don't own stores).
export const SEED_USER_IDS = {
  client: "00000000-0000-4000-8000-000000000001",
  store: "00000000-0000-4000-8000-000000000002",
  admin: "00000000-0000-4000-8000-000000000003",
  store2: "00000000-0000-4000-8000-000000000004",
  store3: "00000000-0000-4000-8000-000000000005",
} as const;

export const SEED_STORE_IDS = {
  donaRosa: "10000000-0000-4000-8000-000000000001",
  panchoParque: "10000000-0000-4000-8000-000000000002",
  heladosTino: "10000000-0000-4000-8000-000000000003",
} as const;
