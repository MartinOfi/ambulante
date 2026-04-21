# ADR-0002 — Realtime transport: Supabase Realtime

**Date:** 2026-04-16
**Status:** Accepted
**Deciders:** project architect

---

## Context

Ambulante's core UX requires low-latency propagation of two event streams:

1. **Store location updates** — stores broadcast GPS coordinates every 30–60s while active.
2. **Order state transitions** — both the client and the store must see state changes (accepted, rejected, in-transit, finalized) within <5 seconds.

The PRD (§7.2) sets a hard acceptance criterion of <5s end-to-end propagation. The solution must also handle reconnection automatically, as mobile clients frequently drop and re-acquire network connections.

The backend is Supabase (DP-1). The choice of realtime transport determines whether we can leverage Supabase's existing infrastructure or must introduce a second WebSocket service.

## Decision

We will use **Supabase Realtime** as the realtime transport layer.

All realtime communication is wrapped behind a `RealtimeService` interface (`shared/services/realtime.ts`) with `subscribe(channel, handler)`, `unsubscribe(channel)`, and `status` surface. The Supabase Realtime client is injected at the infrastructure layer; feature code never imports it directly.

## Alternatives considered

| Option | Pros | Cons | Reason rejected |
|---|---|---|---|
| Supabase Realtime | Already included with Supabase; Postgres-native change events; built-in reconnect + presence | Proprietary protocol; coupled to Supabase | Accepted trade-off given DP-1 |
| Pusher / Ably | Mature, cross-platform, battle-tested reconnect | Extra vendor + billing; decoupled from Supabase DB events | Additional operational cost and moving part |
| Self-hosted WebSocket (e.g., Socket.io) | Full control | Requires deployment, scaling, and maintenance beyond MVP scope | Operational overhead not justified at this stage |
| HTTP polling | Simple, no persistent connection | Latency too high to meet <5s criterion under realistic polling intervals; battery/bandwidth impact on mobile | Does not meet PRD §7.2 latency requirement |
| Server-Sent Events (SSE) | Simpler than WebSockets; native browser support | Unidirectional; store location updates need bidirectional flow | Store GPS updates require client→server pushes from the store app; SSE is server→client only |

## Consequences

### Positive
- Postgres `INSERT`/`UPDATE` events on the `orders` table propagate automatically via Supabase Realtime without application-layer broadcasting logic.
- Store location updates reuse the same channel infrastructure.
- Built-in reconnect logic handles mobile network transitions.
- `RealtimeService` abstraction means the transport can be swapped (e.g., to self-hosted WebSocket) by replacing a single factory function.

### Negative / trade-offs
- Supabase Realtime has a concurrent connections limit on the free plan (~200). Requires plan upgrade for production scale.
- The `RealtimeService` mock (in-memory event bus) can diverge subtly from Supabase's ordering and delivery guarantees. Integration tests against a real Supabase instance are required before go-live.
- Supabase Realtime v2 (Broadcast + Presence + Postgres Changes) has slightly different channel semantics than v1. We target v2.

### Neutral
- Domain events flow through the local `eventBus` during the mock phase and will be wired to Supabase Realtime channels when the backend is integrated.

## References

- `docs/EPIC-ARCHITECTURE.md` DP-1, F5.1, F5.2 — decision points and task chain
- `shared/services/realtime.ts` — RealtimeService interface + mock _(created in F5.2, not yet in main)_
- `shared/domain/event-bus.ts` — in-memory event bus (mock-phase integration) _(created in F3.5, not yet in main)_
- PRD §7.2 — realtime latency requirement (<5s); the mechanism recommendation in that section ("WebSockets or SSE") is superseded by this ADR's decision
