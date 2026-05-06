import { createBrowserClient } from "@/shared/repositories/supabase/client";
import { contentModerationService as mockService } from "./content-moderation.mock";
import { createSupabaseContentModerationService } from "./content-moderation.supabase";
import type { ContentModerationService } from "./content-moderation.service";

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const _client = isMock ? null : createBrowserClient();

export const contentModerationService: ContentModerationService = isMock
  ? mockService
  : createSupabaseContentModerationService(_client!);
