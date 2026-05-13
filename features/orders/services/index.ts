import { ordersService as mockOrdersService } from "./orders.mock";
import { ordersService as supabaseOrdersService } from "./orders.supabase";

export type { OrdersService, FindByUserInput, FindByStoreInput } from "./orders.service";

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const ordersService = isMock ? mockOrdersService : supabaseOrdersService;
