# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Ambulante project.

## What is an ADR?

An ADR documents a significant architectural decision: the context that drove it, the decision itself, and its consequences. They are immutable once accepted — superseded decisions get a new ADR referencing the old one.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [0000](0000-template.md) | Template | — | — |
| [0001](0001-auth-provider.md) | Authentication provider: Supabase Auth | Accepted | 2026-04-16 |
| [0002](0002-realtime-transport.md) | Realtime transport: Supabase Realtime | Accepted | 2026-04-16 |
| [0003](0003-features-shared-architecture.md) | Feature isolation with shared cross-cutting layer | Accepted | 2026-04-16 |

## Status lifecycle

`Proposed` → `Accepted` → `Deprecated` / `Superseded by ADR-XXXX`

## How to add a new ADR

1. Copy `0000-template.md` to `NNNN-short-title.md` (next sequential number).
2. Fill in all sections — never leave Context or Consequences blank.
3. Add a row to the index table above.
4. Submit as part of the PR that implements the decision.
