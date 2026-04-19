import { screen } from "@/shared/test-utils";
import { renderWithProviders } from "@/shared/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import { OrderHistoryScreenContainer } from "./OrderHistoryScreen.container";

vi.mock("@/shared/hooks/useSession", () => ({
  useSession: vi.fn(),
}));

vi.mock("@/features/orders/hooks/useOrdersQuery", () => ({
  useOrdersQuery: vi.fn(),
}));

vi.mock("@/features/orders/hooks/useStatusParam", () => ({
  useStatusParam: vi.fn(() => [null, vi.fn()]),
}));

import { useSession } from "@/shared/hooks/useSession";
import { useOrdersQuery } from "@/features/orders/hooks/useOrdersQuery";

const mockUseSession = vi.mocked(useSession);
const mockUseOrdersQuery = vi.mocked(useOrdersQuery);

const MOCK_SESSION = {
  accessToken: "tok",
  refreshToken: "ref",
  expiresAt: 9999999999,
  user: { id: "user-1", email: "test@test.com", role: "client" as const },
};

describe("OrderHistoryScreenContainer", () => {
  beforeEach(() => {
    mockUseOrdersQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useOrdersQuery>);
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

  it("passes isLoading=true when query is loading", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      session: MOCK_SESSION,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    mockUseOrdersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useOrdersQuery>);

    renderWithProviders(<OrderHistoryScreenContainer />);

    expect(screen.getByTestId("orders-loading")).toBeInTheDocument();
  });
});
