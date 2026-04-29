import { screen } from "@/shared/test-utils";
import { renderWithProviders } from "@/shared/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import { OrderHistoryScreenContainer } from "./OrderHistoryScreen.container";

vi.mock("@/shared/hooks/useSession", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/features/orders/hooks/useOrderHistory", () => ({
  useOrderHistory: vi.fn(),
}));

vi.mock("@/features/orders/hooks/useStatusParam", () => ({
  useStatusParam: vi.fn(() => [null, vi.fn()]),
}));

import { useSession } from "@/shared/hooks/useSession";
import { useOrderHistory } from "@/features/orders/hooks/useOrderHistory";

const mockUseSession = vi.mocked(useSession);
const mockUseOrderHistory = vi.mocked(useOrderHistory);

const MOCK_SESSION = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: 9999999999,
  user: { id: "user-1", email: "test@test.com", role: "client" as const },
};

function buildHookReturn(
  override: Partial<ReturnType<typeof useOrderHistory>> = {},
): ReturnType<typeof useOrderHistory> {
  return {
    data: { pages: [], pageParams: [] },
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...override,
  } as unknown as ReturnType<typeof useOrderHistory>;
}

describe("OrderHistoryScreenContainer", () => {
  beforeEach(() => {
    mockUseOrderHistory.mockReturnValue(buildHookReturn());
  });

  it("renders empty state when unauthenticated", () => {
    mockUseSession.mockReturnValue({
      status: "unauthenticated",
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithProviders(<OrderHistoryScreenContainer />);

    expect(screen.getByText(/no tenés pedidos/i)).toBeInTheDocument();
  });

  it("renders empty state when authenticated with no orders", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      session: MOCK_SESSION,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithProviders(<OrderHistoryScreenContainer />);

    expect(screen.getByText(/no tenés pedidos/i)).toBeInTheDocument();
  });

  it("renders skeleton when loading", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      session: MOCK_SESSION,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseOrderHistory.mockReturnValue(
      buildHookReturn({ data: undefined, isLoading: true }),
    );

    renderWithProviders(<OrderHistoryScreenContainer />);

    expect(screen.getByTestId("orders-loading")).toBeInTheDocument();
  });

  it("renders 'Cargar más' button when hasNextPage is true", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      session: MOCK_SESSION,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseOrderHistory.mockReturnValue(
      buildHookReturn({
        data: {
          pages: [
            {
              orders: [
                {
                  id: "o-1",
                  clientId: "user-1",
                  storeId: "store-1",
                  status: "FINALIZADO",
                  items: [],
                  createdAt: "2026-04-29T10:00:00.000Z",
                  updatedAt: "2026-04-29T10:00:00.000Z",
                },
              ],
              nextCursor: "next",
            },
          ],
          pageParams: [null],
        },
        hasNextPage: true,
      }),
    );

    renderWithProviders(<OrderHistoryScreenContainer />);

    expect(screen.getByRole("button", { name: /cargar más/i })).toBeInTheDocument();
  });
});
