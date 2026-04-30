import { orderRepository, storeRepository } from "@/shared/repositories";
import { createKpiDashboardService } from "./kpi-dashboard.service";
import { kpiDashboardService as mockService } from "./kpi-dashboard.mock";
import type { KpiDashboardService } from "@/features/admin-kpi-dashboard/types/kpi-dashboard.types";

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const kpiDashboardService: KpiDashboardService = isMock
  ? mockService
  : createKpiDashboardService(orderRepository, storeRepository);
