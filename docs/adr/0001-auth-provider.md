# ADR-0001 — Authentication provider: Supabase Auth

**Date:** 2026-04-16
**Status:** Accepted
**Deciders:** project architect

---

## Context

Ambulante has three user roles — Client, Store, and Admin — each with distinct permissions and routing. Authentication must be ready before any protected route, middleware interceptor, or session-aware component can be built. The choice of provider shapes the entire User model and session hook API.

Key constraints:
- The backend will run on Supabase (DP-1), so the auth system must integrate tightly with Supabase's Row Level Security (RLS) and real-time subscriptions.
- The team is small; operational complexity must be minimized.
- Social login (Google, Apple) is a likely near-term requirement.
- We must support JWT-based sessions for SSR (Next.js middleware) without an extra hop.

## Decision

We will use **Supabase Auth** as the authentication provider.

The `AuthService` interface (`shared/services/auth.ts`) wraps Supabase Auth client calls. During the mock phase, a drop-in mock implementation is injected — the rest of the codebase never imports the Supabase SDK directly.

## Alternatives considered

| Option | Pros | Cons | Reason rejected |
|---|---|---|---|
| NextAuth.js v5 | Framework-agnostic, large ecosystem | Requires separate DB adapter; adds a hop between Next.js and Supabase | Duplication of session state management; extra moving part |
| Clerk | Excellent DX, drop-in UI components | Paid beyond free tier; tight vendor lock-in; external session store diverges from Supabase RLS | Cost and coupling concerns for MVP |
| Custom auth (JWT + bcrypt) | Full control | High implementation cost, security risk, no social login out of the box | Not appropriate for a small team MVP |
| Supabase Auth | Native integration with Supabase Postgres + RLS, built-in social providers, service-role JWT for server middleware | Vendor lock-in to Supabase | Accepted trade-off given DP-1 already selects Supabase as the backend |

## Consequences

### Positive
- Session JWTs are issued by Supabase and readable by Next.js middleware with no extra API call.
- RLS policies can use `auth.uid()` directly, eliminating a class of authorization bugs.
- Social login (Google, Apple) requires zero extra infrastructure.
- Supabase Auth UI components available if we need a quick login page.

### Negative / trade-offs
- If we ever migrate away from Supabase, the `AuthService` abstraction layer softens — but does not eliminate — the migration cost.
- Supabase Auth email templates are limited; custom transactional email requires a SMTP integration.

### Neutral
- `useSession` hook returns a discriminated union (`loading | authenticated | unauthenticated | error`), decoupling components from the underlying provider.

## References

- `docs/EPIC-ARCHITECTURE.md` DP-2 — decision point that settled this choice
- `shared/services/auth.ts` — AuthService interface + mock implementation _(created in F2.3, not yet in main)_
- `shared/hooks/useSession.ts` — session hook _(created in F2.3, not yet in main)_
- `shared/types/user.ts` — User model + UserRole _(created in F2.2, not yet in main)_
