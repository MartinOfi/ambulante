# ADR-0003 — Feature isolation with shared cross-cutting layer

**Date:** 2026-04-16
**Status:** Accepted
**Deciders:** project architect

---

## Context

Ambulante will grow to have multiple distinct product areas: the customer map flow, the store dashboard, the order flow, admin tooling, and eventually onboarding. In early projects it is tempting to organize code by technical type (`components/`, `hooks/`, `services/`) rather than by domain concern.

That organization breaks down quickly:
- Deleting a feature requires hunting across every technical directory.
- A component in `components/` may silently depend on a hook from a different feature's domain, creating invisible coupling.
- Onboarding a new developer is harder because the folder structure does not communicate what the product does.

The constraint: we need a structure where **removing a feature never breaks another feature**, and where **shared infrastructure is explicitly governed**.

## Decision

We will organize all product code under two top-level directories:

- **`features/<name>/`** — each feature is a self-contained island. It owns its components, hooks, services, types, utils, and tests. Features never import from each other.
- **`shared/`** — the single permitted cross-cutting layer. Anything used in two or more features lives here behind a stable interface and is documented in `shared/REGISTRY.md`.

The `app/` directory (Next.js App Router) contains only routing concerns: layouts, pages, and route groups. It consumes features via their public barrel exports (`features/<name>/index.ts`).

Promotion rule: code starts inside a feature. Once a second feature needs it, it moves to `shared/` and the REGISTRY is updated in the same commit.

## Alternatives considered

| Option | Pros | Cons | Reason rejected |
|---|---|---|---|
| Type-based organization (`components/`, `hooks/`, `services/`) | Familiar to many developers | Invisible cross-feature coupling; deleting a feature is hard | Scales poorly with multiple product domains |
| Monorepo with separate packages per feature | Strong isolation via package boundaries | High setup cost; premature for a solo/small team MVP | Deferred — monorepo tooling overhead not justified at MVP scale; revisit when team grows or parallel apps (marketing site, standalone admin) are needed (tracked as DP-8 in `docs/EPIC-ARCHITECTURE.md`) |
| Feature flags only, no structural separation | Low friction to start | No structural guarantee of isolation | Coupling is a structural problem; flags don't prevent it |

## Consequences

### Positive
- Deleting a feature is a single `rm -rf features/<name>` with no side effects on other features.
- New developers can understand the product from the folder structure alone.
- `shared/REGISTRY.md` makes shared infrastructure discoverable and prevents accidental duplication.
- Easy to scope code reviews: a PR touching only `features/order-flow/` has no impact on the map feature.

### Negative / trade-offs
- Requires discipline to not import across feature boundaries. Enforced by convention (no ESLint rule yet — see potential F0.x follow-up).
- The promotion step (feature → shared) introduces a small refactoring overhead when a second feature needs something.
- `shared/` can become a "junk drawer" if the promotion rule is not enforced.

### Neutral
- `app/` becomes thin routing-only layer, which aligns with Next.js App Router's design intent.

## References

- `CLAUDE.md` §4 — Arquitectura de carpetas (including the promotion rule: feature → shared when used in 2+ places)
- `shared/REGISTRY.md` — live index of shared infrastructure
