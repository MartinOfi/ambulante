import type { StoreRepository } from "./store";
import type { OrderRepository } from "./order";
import type { UserRepository } from "./user";
import type { ProductRepository } from "./product";

import { storeRepository as mockStoreRepository } from "./mock/store.mock";
import { orderRepository as mockOrderRepository } from "./mock/order.mock";
import { userRepository as mockUserRepository } from "./mock/user.mock";
import { productRepository as mockProductRepository } from "./mock/product.mock";

// Import from client.browser (not client.ts) to avoid pulling in next/headers,
// which would contaminate any Client Component that imports this barrel.
import { createBrowserClient as _createBrowserClient } from "./supabase/client.browser";
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
export { createBrowserClient } from "./supabase/client.browser";

// ── Factory singletons: real Supabase when both env vars present, mocks otherwise ─
// Read vars here with literal dot-notation so webpack inlines them in the browser
// bundle. Passing them explicitly to createBrowserClient avoids a second read inside
// that function where bracket-notation would fall back to undefined.
const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isMock = !_supabaseUrl || !_supabaseAnonKey;

const _client = isMock ? null : _createBrowserClient(_supabaseUrl, _supabaseAnonKey);

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
