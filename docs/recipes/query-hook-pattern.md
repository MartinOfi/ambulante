# Recipe: `useXxxQuery` — canonical data-fetching hook pattern

**Feature introduced in:** F4.1  
**Reference implementation:** `features/map/hooks/useStoresNearbyQuery.ts`

---

## The pattern

```typescript
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query/keys";
import { someService } from "@/shared/services/some";
import { logger } from "@/shared/utils/logger";
import type { SomeInput } from "@/shared/types/some";

export interface UseSomeQueryInput {
  readonly param: SomeInput | null;
}

export function useSomeQuery({ param }: UseSomeQueryInput) {
  const query = useQuery({
    queryKey: param
      ? queryKeys.some.byParam(param)
      : queryKeys.some.all(),
    queryFn: async () => {
      if (!param) throw new Error("param required");
      return someService.findByParam({ param });
    },
    enabled: param !== null,
  });

  useEffect(() => {
    if (query.isError) {
      logger.error("useSomeQuery: fetch failed", {
        param,
        error: query.error instanceof Error ? query.error.message : String(query.error),
      });
    }
  }, [query.isError, query.error, param]);

  return query;
}
```

---

## Rules

### Always use `queryKeys` — never inline strings

```typescript
// Wrong
queryKey: ["stores", "nearby", coords]

// Correct
queryKey: queryKeys.stores.nearby(coords, radiusMeters)
```

`queryKeys` lives in `shared/query/keys.ts`. Add keys there when creating a new domain.

### Use `enabled` to prevent fetching without required inputs

```typescript
enabled: coords !== null
```

When `enabled` is `false`, React Query sets `fetchStatus: "idle"` and never calls `queryFn`. The consumer receives `data: undefined` — not an error state.

### Return the full React Query result — let consumers destructure

The hook returns `useQuery(...)` directly. Consumers take what they need:

```typescript
// Consumer
const { data: stores = [], isLoading, isError } = useStoresNearbyQuery({ coords, radius });
```

The `= []` default at the destructuring site makes the typing explicit: the component declares its own empty-state fallback. The hook does not impose a default.

### No `useState`, no manual loading flags — `useEffect` is allowed only for side effects

React Query manages loading and error state. The old manual pattern:

```typescript
// Old — do not use
const [stores, setStores] = useState([]);
const [isLoading, setIsLoading] = useState(false);
useEffect(() => { ... storesService.findNearby(...).then(setStores) }, [coords]);
```

Has been replaced by this pattern in all data-fetching hooks. See `useNearbyStores.ts` as the before-state.

### Log errors via `logger`, never `console.*`

```typescript
useEffect(() => {
  if (query.isError) {
    logger.error("useSomeQuery: fetch failed", { error: query.error });
  }
}, [query.isError, query.error]);
```

`logger` from `@/shared/utils/logger` is the only permitted logging interface (CLAUDE.md §6.7).

> Note: React Query v5 removed `onError` callbacks from `useQuery` options. `meta.onError` is a plain data bag and is never called automatically — use a `useEffect` watching `isError` instead.

---

## How to wire a new query hook

1. Add a `queryKey` factory to `shared/query/keys.ts` if one does not exist for the new domain.
2. Create `features/<name>/hooks/use<Entity>Query.ts` following the template above.
3. Add `"use client"` at the top — all query hooks run client-side.
4. Export the input interface (`Use<Entity>QueryInput`) alongside the hook for consumer typing.
5. Update `shared/REGISTRY.md` if the hook is used in 2+ features (promote to `shared/hooks/`).

---

## Testing

Use a fresh `QueryClient` per test with `retry: false` to avoid masked errors and flaky retries:

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}
```

Four required test cases for every query hook:

| Case | What to assert |
|------|---------------|
| Disabled (null input) | `fetchStatus === "idle"`, service not called |
| Happy path | `isSuccess`, `data` equals mock result, service called with correct args |
| Loading state | `isLoading === true` before resolution |
| Error path | `isError === true`, `data` is undefined |

See `features/map/hooks/useStoresNearbyQuery.test.ts` for the full test suite.
