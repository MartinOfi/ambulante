"use client";

import {
  createBrowserClient,
  SupabaseUserRepository,
  SupabaseOrderRepository,
} from "@/shared/repositories";
import { createUserManagementService } from "./userManagement.service";
import type { UserManagementService } from "./userManagement.service";

let cached: UserManagementService | null = null;

export function getUserManagementService(): UserManagementService {
  if (cached !== null) return cached;
  const client = createBrowserClient();
  cached = createUserManagementService({
    userRepository: new SupabaseUserRepository(client),
    orderRepository: new SupabaseOrderRepository(client),
  });
  return cached;
}
