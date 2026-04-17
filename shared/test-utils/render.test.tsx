import { useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { useQueryState } from "nuqs";
import { describe, expect, it } from "vitest";

import { createTestQueryClient, renderWithProviders } from "@/shared/test-utils";

function QueryConsumer() {
  const { data } = useQuery({
    queryKey: ["test"],
    queryFn: () => "query-data",
    staleTime: Infinity,
  });
  return <div data-testid="query-data">{data ?? "loading"}</div>;
}

function NuqsConsumer() {
  const [value] = useQueryState("q");
  return <div data-testid="nuqs-value">{value ?? "empty"}</div>;
}

describe("renderWithProviders", () => {
  it("provides QueryClient so hooks work without error", () => {
    renderWithProviders(<QueryConsumer />);
    expect(screen.getByTestId("query-data")).toBeInTheDocument();
  });

  it("provides nuqs adapter so useQueryState works", () => {
    renderWithProviders(<NuqsConsumer />);
    expect(screen.getByTestId("nuqs-value")).toHaveTextContent("empty");
  });

  it("accepts a custom queryClient for pre-seeding data", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["test"], "pre-seeded");

    renderWithProviders(<QueryConsumer />, { queryClient });

    expect(screen.getByTestId("query-data")).toHaveTextContent("pre-seeded");
  });

  it("each call gets an isolated QueryClient by default", () => {
    const firstClient = createTestQueryClient();
    firstClient.setQueryData(["test"], "poisoned-data");
    const { unmount } = renderWithProviders(<QueryConsumer />, { queryClient: firstClient });
    unmount();

    renderWithProviders(<QueryConsumer />);
    expect(screen.getByTestId("query-data")).not.toHaveTextContent("poisoned-data");
    expect(screen.getByTestId("query-data")).toHaveTextContent("loading");
  });
});
