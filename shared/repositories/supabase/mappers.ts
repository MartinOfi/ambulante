import type { User, UserRole } from "@/shared/schemas/user";
import type { Store, StoreKind, StoreStatus } from "@/shared/schemas/store";
import type { Product } from "@/shared/schemas/product";
import type { Order, OrderItem } from "@/shared/schemas/order";
import { ORDER_STATUS } from "@/shared/constants/order";
import type { OrderStatus } from "@/shared/constants/order";
import type { PushSubscription } from "@/shared/repositories/push-subscriptions";

// ── User role mappings ─────────────────────────────────────────────────────────

const DB_ROLE_TO_DOMAIN: Record<string, UserRole> = {
  cliente: "client",
  tienda: "store",
  admin: "admin",
};

const DOMAIN_ROLE_TO_DB: Record<UserRole, string> = {
  client: "cliente",
  store: "tienda",
  admin: "admin",
};

export function dbRoleToDomain(dbRole: string): UserRole {
  const mapped = DB_ROLE_TO_DOMAIN[dbRole];
  if (mapped === undefined) throw new Error(`Unknown DB role: ${dbRole}`);
  return mapped;
}

export function domainRoleToDb(role: UserRole): string {
  return DOMAIN_ROLE_TO_DB[role];
}

// ── Order status mappings ──────────────────────────────────────────────────────

export function dbStatusToDomain(dbStatus: string): OrderStatus {
  const upper = dbStatus.toUpperCase();
  if (!(Object.values(ORDER_STATUS) as string[]).includes(upper)) {
    throw new Error(`dbStatusToDomain: unknown DB status "${dbStatus}"`);
  }
  return upper as OrderStatus;
}

export function domainStatusToDb(status: OrderStatus): string {
  return status.toLowerCase();
}

// ── Store kind / status mappings ───────────────────────────────────────────────

export function dbCategoryToKind(category: string | null): StoreKind {
  if (category === null) return "food-truck";
  const VALID_KINDS: readonly StoreKind[] = ["food-truck", "street-cart", "ice-cream"];
  // Cast required: StoreKind[].includes() only accepts StoreKind, but we're validating an untyped string
  if ((VALID_KINDS as string[]).includes(category)) return category as StoreKind;
  throw new Error(`dbCategoryToKind: unknown category "${category}"`);
}

export function dbAvailableToStatus(available: boolean): StoreStatus {
  return available ? "open" : "closed";
}

// ── Row → domain mappers ───────────────────────────────────────────────────────

export interface DbUserRow {
  public_id: string;
  role: string;
  display_name: string | null;
  email: string | null;
  suspended: boolean | null;
}

export function mapUserRow(row: DbUserRow): User {
  return {
    id: row.public_id,
    email: row.email ?? "",
    role: dbRoleToDomain(row.role),
    displayName: row.display_name ?? undefined,
    suspended: row.suspended ?? undefined,
  };
}

export interface DbStoreViewRow {
  public_id: string;
  owner_public_id: string;
  name: string;
  description: string | null;
  category: string | null;
  available: boolean;
  photo_url: string | null;
  tagline: string | null;
  price_from_ars: number | string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  distance_meters?: number | null;
}

const PLACEHOLDER_PHOTO_URL = "https://ambulante.app/placeholder-store.png";

export function mapStoreRow(row: DbStoreViewRow): Store {
  return {
    id: row.public_id,
    ownerId: row.owner_public_id,
    name: row.name,
    description: row.description ?? undefined,
    kind: dbCategoryToKind(row.category),
    status: dbAvailableToStatus(row.available),
    photoUrl: row.photo_url ?? PLACEHOLDER_PHOTO_URL,
    tagline: row.tagline ?? "",
    priceFromArs: row.price_from_ars !== null ? Number(row.price_from_ars) : 0,
    hours: row.hours ?? undefined,
    location: {
      lat: row.lat ?? 0,
      lng: row.lng ?? 0,
    },
    distanceMeters:
      row.distance_meters !== null && row.distance_meters !== undefined ? row.distance_meters : 0,
  };
}

export interface DbProductRow {
  public_id: string;
  store: { public_id: string } | null;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  available: boolean;
}

export function mapProductRow(row: DbProductRow): Product {
  return {
    id: row.public_id,
    storeId: row.store?.public_id ?? "",
    name: row.name,
    description: row.description ?? undefined,
    priceArs: Number(row.price),
    photoUrl: row.image_url ?? undefined,
    isAvailable: row.available,
  };
}

export interface DbOrderItemRow {
  product_snapshot: {
    id?: string;
    name?: string;
    price?: number;
    priceArs?: number;
    productId?: string;
    productName?: string;
    productPriceArs?: number;
  };
  quantity: number;
}

export function mapOrderItemRow(row: DbOrderItemRow): OrderItem {
  const snap = row.product_snapshot;
  return {
    productId: snap.productId ?? snap.id ?? "",
    productName: snap.productName ?? snap.name ?? "",
    productPriceArs: snap.productPriceArs ?? snap.priceArs ?? snap.price ?? 0,
    quantity: row.quantity,
  };
}

export interface DbOrderRow {
  public_id: string;
  status: string;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
  customer: { public_id: string } | null;
  store: { public_id: string } | null;
  items: DbOrderItemRow[];
}

export function mapOrderRow(row: DbOrderRow): Order {
  return {
    id: row.public_id,
    clientId: row.customer?.public_id ?? "",
    storeId: row.store?.public_id ?? "",
    status: dbStatusToDomain(row.status),
    notes: row.customer_note ?? undefined,
    items: row.items.map(mapOrderItemRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DbPushSubscriptionRow {
  public_id?: string;
  id: number;
  user: { public_id: string } | null;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

export function mapPushSubscriptionRow(row: DbPushSubscriptionRow): PushSubscription {
  return {
    id: String(row.id),
    userId: row.user?.public_id ?? "",
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    authKey: row.auth_key,
    userAgent: row.user_agent ?? undefined,
    createdAt: row.created_at,
  };
}
