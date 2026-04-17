import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { NuqsAdapter } from "nuqs/adapters/react";

import { ThemeProvider } from "@/shared/components/theme/ThemeProvider";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Prevent refetches that would make async assertions non-deterministic
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  readonly queryClient?: QueryClient;
}

function buildWrapper(queryClient: QueryClient) {
  function AllTheProviders({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeProvider>{children}</ThemeProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    );
  }
  return AllTheProviders;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: RenderWithProvidersOptions = {},
) {
  return render(ui, { wrapper: buildWrapper(queryClient), ...renderOptions });
}
