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

// ── Mock singletons (used when NEXT_PUBLIC_SUPABASE_URL is not set) ────────────
export { storeRepository } from "./mock/store.mock";
export { orderRepository } from "./mock/order.mock";
export { userRepository } from "./mock/user.mock";
export { productRepository } from "./mock/product.mock";

// ── Supabase factory ───────────────────────────────────────────────────────────
// Instantiate only when needed (browser client creation is side-effect-free but
// we avoid module-level construction to stay compatible with SSR and test envs).
export { createSupabaseBrowserClient } from "./supabase/client";
export { SupabaseUserRepository } from "./supabase/users.supabase";
export { SupabaseStoreRepository } from "./supabase/stores.supabase";
export { SupabaseProductRepository } from "./supabase/products.supabase";
export { SupabaseOrderRepository } from "./supabase/orders.supabase";
export { SupabaseAuditLogService } from "./supabase/audit-log.supabase";
export { SupabasePushSubscriptionRepository } from "./supabase/push-subscriptions.supabase";
