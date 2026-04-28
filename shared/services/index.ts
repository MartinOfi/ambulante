import type { AuthService } from "./auth.types";
import type { PushService } from "./push.types";
import type { RealtimeService } from "./realtime.types";
import type { StorageService } from "./storage.types";
import { authService as mockAuthService } from "./auth";
import { supabaseAuthService } from "./auth.supabase";
import { pushService as mockPushService } from "./push";
import { supabasePushService } from "./push.supabase";
import { realtimeService as mockRealtimeService } from "./realtime";
import { supabaseRealtimeService } from "./realtime.supabase";
import { storageService as mockStorageService } from "./storage";
import { supabaseStorageService } from "./storage.supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && !supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required when NEXT_PUBLIC_SUPABASE_URL is set");
}

const isMock = !supabaseUrl;

export const authService: AuthService = isMock ? mockAuthService : supabaseAuthService;
export const realtimeService: RealtimeService = isMock
  ? mockRealtimeService
  : supabaseRealtimeService;
export const pushService: PushService = isMock ? mockPushService : supabasePushService;
export const storageService: StorageService = isMock ? mockStorageService : supabaseStorageService;
