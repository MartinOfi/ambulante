import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteHandlerClient } from "@/shared/repositories/supabase/client";
import { slowQueryArraySchema } from "@/shared/types/observability";

const SLOW_QUERIES_LIMIT = 20;

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createRouteHandlerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError) {
    return NextResponse.json({ error: "Error verificando permisos." }, { status: 500 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const { data: rows, error: rpcError } = await supabase.rpc("get_top_slow_queries", {
    p_limit: SLOW_QUERIES_LIMIT,
  });

  if (rpcError) {
    return NextResponse.json({ error: "Error obteniendo queries lentas." }, { status: 500 });
  }

  const mapped = (rows ?? []).map(
    (row: {
      calls: number;
      total_exec_time_ms: number;
      mean_exec_time_ms: number;
      query_text: string;
    }) => ({
      calls: row.calls,
      totalExecTimeMs: row.total_exec_time_ms,
      meanExecTimeMs: row.mean_exec_time_ms,
      queryText: row.query_text,
    }),
  );

  const parsed = slowQueryArraySchema.safeParse(mapped);

  if (!parsed.success) {
    return NextResponse.json({ error: "Respuesta del servidor inválida." }, { status: 500 });
  }

  return NextResponse.json({ data: parsed.data });
}
