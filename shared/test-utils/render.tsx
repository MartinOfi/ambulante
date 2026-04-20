import type { ReactElement, ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/react";
import messages from "@/messages/es-AR.json";

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

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  readonly queryClient?: QueryClient;
}

function buildWrapper(queryClient: QueryClient) {
  function AllTheProviders({ children }: { readonly children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="es-AR" messages={messages}>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </QueryClientProvider>
      </NextIntlClientProvider>
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
