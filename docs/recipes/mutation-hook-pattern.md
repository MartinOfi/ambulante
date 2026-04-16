# Recipe: `useXxxMutation` — canonical mutation hook pattern with optimistic updates

**Feature introduced in:** F4.2  
**Reference implementation:** `features/orders/hooks/useAcceptOrderMutation.ts`

---

## The pattern

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { someService } from "@/features/some/services/some.mock";
import { logger } from "@/shared/utils/logger";
import type { SomeEntity } from "@/shared/domain/some";

interface MutateContext {
  readonly previous: SomeEntity | undefined;
}

export function useSomeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId: string) => someService.doSomething(entityId),

    onMutate: async (entityId: string): Promise<MutateContext> => {
      // 1. Cancel in-flight refetches to avoid overwriting the optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.some.byId(entityId) });
      // 2. Snapshot the current cache value for rollback
      const previous = queryClient.getQueryData<SomeEntity>(queryKeys.some.byId(entityId));
      // 3. Apply optimistic update — always spread to produce a new object (never mutate)
      queryClient.setQueryData<SomeEntity>(queryKeys.some.byId(entityId), (old) => {
        if (old === undefined) return old;
        return { ...old, status: SOME_STATUS.TARGET /* replace with status constant */ } as SomeEntity;
      });
      // 4. Return snapshot as context for potential rollback
      return { previous };
    },

    onError: (error: unknown, entityId: string, context: MutateContext | undefined) => {
      // Rollback: restore the pre-optimistic snapshot
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.some.byId(entityId), context.previous);
      }
      logger.error("useSomeMutation: action failed", {
        entityId,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: (_data, _error, entityId: string) => {
      // Server truth wins: invalidate after any outcome (success or error)
      void queryClient.invalidateQueries({ queryKey: queryKeys.some.byId(entityId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.some.all() });
    },
  });
}
```

---

## Three-phase lifecycle

### `onMutate` — optimistic update + snapshot

Called **synchronously before** `mutationFn` fires. Use it to:

1. Cancel any in-flight refetch for the affected key (avoids a race where the server overwrites the optimistic value).
2. Snapshot the current cache data so it can be restored on failure.
3. Write the optimistic value to the cache using `setQueryData`.
4. Return the snapshot as `context` — React Query passes it to `onError` and `onSettled`.

```typescript
onMutate: async (entityId) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.some.byId(entityId) });
  const previous = queryClient.getQueryData<SomeEntity>(queryKeys.some.byId(entityId));
  queryClient.setQueryData<SomeEntity>(queryKeys.some.byId(entityId), (old) => ({
    ...old,
    status: SOME_STATUS.TARGET /* replace with status constant */,
  }) as SomeEntity);
  return { previous };
},
```

**Note on discriminated unions:** TypeScript's `Order` type is a discriminated union — each status variant requires specific timestamp fields. A spread `{ ...old, status: "ACEPTADO" }` produces a structurally incomplete `OrderAceptado`. Use `as Order` with a comment explaining the cast is safe because `onSettled` immediately invalidates the entry and server truth replaces it.

### `onError` — rollback

Called when `mutationFn` rejects. Restores the snapshot captured in `onMutate`:

```typescript
onError: (error, entityId, context) => {
  if (context?.previous !== undefined) {
    queryClient.setQueryData(queryKeys.some.byId(entityId), context.previous);
  }
  logger.error("...", { entityId, error: error instanceof Error ? error.message : String(error) });
},
```

### `onSettled` — invalidate (server truth wins)

Called after **any** outcome — success or error. Triggers a background refetch so stale optimistic data is replaced by the authoritative server value:

```typescript
onSettled: (_data, _error, entityId) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.some.byId(entityId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.some.all() });
},
```

---

## Key distinction from query hooks: `onError` vs `useEffect`

| Hook type | Error callback | Why |
|-----------|---------------|-----|
| `useQuery` | `useEffect(() => { if (isError) logger.error(...) }, [isError])` | React Query v5 removed `onError` from `useQuery` options. `meta.onError` is a plain data bag that is never called automatically. |
| `useMutation` | `onError` callback in `useMutation` options | `onError` IS a real lifecycle callback for mutations — it receives the error, variables, and context. Use it directly. Do NOT replicate the `useEffect + isError` pattern for mutations. |

```typescript
// Query hook — correct pattern
useEffect(() => {
  if (query.isError) logger.error("failed", { error: query.error });
}, [query.isError, query.error]);

// Mutation hook — correct pattern
useMutation({
  onError: (error, variables, context) => {
    logger.error("failed", { error });
  },
});
```

---

## How to wire a new mutation hook

1. Create `features/<name>/services/<entity>.service.ts` with the `<Entity>Service` interface only.
2. Create `features/<name>/services/<entity>.mock.ts` importing from `<entity>.service.ts`; implement with a `MOCK_NETWORK_DELAY_MS` constant and throw "not implemented".
3. Create `features/<name>/hooks/use<Action><Entity>Mutation.ts` following the template above.
3. Return `useMutation(...)` directly so consumers get `{ mutate, isPending, isError, isSuccess, data }`.
5. Update `features/<name>/index.ts` barrel export.
6. Update `shared/REGISTRY.md` if the hook is used in 2+ features (promote to `shared/hooks/`).

---

## Required test cases

Every mutation hook must have these four test cases:

| Case | What to assert |
|------|---------------|
| **Optimistic update** | Before mutation settles, cache entry shows the expected optimistic value |
| **Success — invalidation** | After success, `queryClient.invalidateQueries` called for both `byId` and `all` keys |
| **Error — rollback** | When service rejects, cache is restored to the pre-optimistic value |
| **Error — logger** | When service rejects, `logger.error` called with context including the entity ID |

### Test setup

Use a fresh `QueryClient` per test with `retry: false` on both queries and mutations:

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { readonly children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    },
  };
}
```

Expose `queryClient` from the factory so tests can pre-seed cache data and spy on `invalidateQueries`.

See `features/orders/hooks/useAcceptOrderMutation.test.ts` for the full test suite.

---

## Rules

### Always use `queryKeys` — never inline strings

```typescript
// Wrong
queryKey: ["orders", "by-id", orderId]

// Correct
queryKey: queryKeys.orders.byId(orderId)
```

### Never mutate the cache value — always spread

```typescript
// Wrong
queryClient.setQueryData(key, (old) => {
  old.status = "ACEPTADO"; // mutation!
  return old;
});

// Correct
queryClient.setQueryData(key, (old) => ({ ...old, status: "ACEPTADO" } as Order));
```

### Log errors via `logger`, never `console.*`

`logger` from `@/shared/utils/logger` is the only permitted logging interface (CLAUDE.md §6.7).
