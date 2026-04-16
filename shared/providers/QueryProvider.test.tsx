import { useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueryProvider } from "./QueryProvider";

function FetchComponent() {
  const { data, status } = useQuery({
    queryKey: ["test"],
    queryFn: () => Promise.resolve("ok"),
  });

  return <div data-testid="status">{status === "success" ? data : status}</div>;
}

describe("QueryProvider", () => {
  it("renders children without crashing", () => {
    render(
      <QueryProvider>
        <div data-testid="child">hello</div>
      </QueryProvider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("provides a working QueryClient to children", async () => {
    render(
      <QueryProvider>
        <FetchComponent />
      </QueryProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ok"),
    );
  });

  it("mounts without throwing when nested context is accessed", () => {
    expect(() =>
      render(
        <QueryProvider>
          <span />
        </QueryProvider>,
      ),
    ).not.toThrow();
  });
});
