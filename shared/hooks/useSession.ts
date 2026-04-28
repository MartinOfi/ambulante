"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@/shared/types/user";
import { authService as defaultAuthService } from "@/shared/services";
import type { AuthService, SignInInput, SignUpInput } from "@/shared/services/auth.types";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated" }
  | { status: "error"; error: string };

export type UseSessionResult = SessionState & {
  signIn(input: SignInInput): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signOut(): Promise<void>;
};

export function useSession(service: AuthService = defaultAuthService): UseSessionResult {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    service.getSession().then((session) => {
      if (!active) return;
      setState(session ? { status: "authenticated", session } : { status: "unauthenticated" });
    });

    const unsubscribe = service.onAuthStateChange((session) => {
      if (!active) return;
      setState(session ? { status: "authenticated", session } : { status: "unauthenticated" });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [service]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const result = await service.signIn(input);
      if (!result.success) {
        setState({ status: "error", error: result.error });
      }
    },
    [service],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const result = await service.signUp(input);
      if (!result.success) {
        setState({ status: "error", error: result.error });
      }
    },
    [service],
  );

  const signOut = useCallback(async () => {
    await service.signOut();
  }, [service]);

  return { ...state, signIn, signUp, signOut };
}
