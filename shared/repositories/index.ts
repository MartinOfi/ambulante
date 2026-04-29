import type { StoreRepository } from "./store";
import type { OrderRepository } from "./order";
import type { UserRepository } from "./user";
import type { ProductRepository } from "./product";

import { storeRepository as mockStoreRepository } from "./mock/store.mock";
import { orderRepository as mockOrderRepository } from "./mock/order.mock";
import { userRepository as mockUserRepository } from "./mock/user.mock";
import { productRepository as mockProductRepository } from "./mock/product.mock";

// Supabase implementations only type-import client.ts, so loading these classes
// is safe in all environments. The throw in client.ts fires only when
// _createBrowserClient() is actually called — see comment on `_client` below.
import { createBrowserClient as _createBrowserClient } from "./supabase/client";
import { SupabaseStoreRepository as _SupabaseStoreRepo } from "./supabase/stores.supabase";
import { SupabaseOrderRepository as _SupabaseOrderRepo } from "./supabase/orders.supabase";
import { SupabaseUserRepository as _SupabaseUserRepo } from "./supabase/users.supabase";
import { SupabaseProductRepository as _SupabaseProductRepo } from "./supabase/products.supabase";

// ── Type re-exports ────────────────────────────────────────────────────────────
export type { Repository } from "./base";
export type {
  StoreRepository,
  StoreFilters,
  FindNearbyInput,
  CreateStoreInput,
  UpdateStoreInput,
} from "./store";
export type { OrderRepository, OrderFilters, CreateOrderInput, UpdateOrderInput } from "./order";
export type { UserRepository, UserFilters, CreateUserInput, UpdateUserInput } from "./user";
export type {
  ProductRepository,
  ProductFilters,
  CreateProductInput,
  UpdateProductInput,
} from "./product";
export type {
  PushSubscriptionRepository,
  PushSubscriptionFilters,
  CreatePushSubscriptionInput,
  UpdatePushSubscriptionInput,
  PushSubscription,
} from "./push-subscriptions";

// ── Supabase implementation classes (for callers that need constructor injection) ─
export { SupabaseUserRepository } from "./supabase/users.supabase";
export { SupabaseStoreRepository } from "./supabase/stores.supabase";
export { SupabaseProductRepository } from "./supabase/products.supabase";
export { SupabaseOrderRepository } from "./supabase/orders.supabase";
export { SupabaseAuditLogService } from "./supabase/audit-log.supabase";
export { SupabasePushSubscriptionRepository } from "./supabase/push-subscriptions.supabase";
export { createBrowserClient } from "./supabase/client";

// ── Factory singletons: real Supabase when both env vars present, mocks otherwise ─
// Mirrors services/index.ts. Both vars are required — createBrowserClient() calls
// getRequiredEnv() for each. Gating on both prevents an import-time throw when only
// one is set (e.g. .env.example ships URL but not ANON_KEY).
const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const _client = isMock ? null : _createBrowserClient();

export const storeRepository: StoreRepository = isMock
  ? mockStoreRepository
  : new _SupabaseStoreRepo(_client!);

export const orderRepository: OrderRepository = isMock
  ? mockOrderRepository
  : new _SupabaseOrderRepo(_client!);

export const userRepository: UserRepository = isMock
  ? mockUserRepository
  : new _SupabaseUserRepo(_client!);

export const productRepository: ProductRepository = isMock
  ? mockProductRepository
  : new _SupabaseProductRepo(_client!);
