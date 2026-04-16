import { useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QueryProvider, computeRetryDelay, isClientError, shouldRetry } from "./QueryProvider";

// ─── existing tests ────────────────────────────────────────────────────────

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

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ok"));
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

// ─── retry policy tests ────────────────────────────────────────────────────

describe("isClientError", () => {
  it("returns true for 400 errors", () => {
    expect(isClientError({ status: 400 })).toBe(true);
  });

  it("returns true for 404 errors", () => {
    expect(isClientError({ status: 404 })).toBe(true);
  });

  it("returns true for 422 errors", () => {
    expect(isClientError({ status: 422 })).toBe(true);
  });

  it("returns true for 499 errors", () => {
    expect(isClientError({ status: 499 })).toBe(true);
  });

  it("returns false for 500 errors", () => {
    expect(isClientError({ status: 500 })).toBe(false);
  });

  it("returns false for network errors (no status)", () => {
    expect(isClientError(new Error("Network Error"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isClientError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isClientError(undefined)).toBe(false);
  });

  it("returns false for 200 (not an error code range but verifies lower bound)", () => {
    expect(isClientError({ status: 200 })).toBe(false);
  });
});

describe("computeRetryDelay", () => {
  it("returns 1000ms for attempt 0", () => {
    expect(computeRetryDelay(0)).toBe(1_000);
  });

  it("returns 2000ms for attempt 1", () => {
    expect(computeRetryDelay(1)).toBe(2_000);
  });

  it("returns 4000ms for attempt 2", () => {
    expect(computeRetryDelay(2)).toBe(4_000);
  });

  it("caps at 30000ms for large attempt indices", () => {
    expect(computeRetryDelay(10)).toBe(30_000);
  });

  it("caps at 30000ms for attempt 5", () => {
    expect(computeRetryDelay(5)).toBe(30_000);
  });
});

describe("shouldRetry", () => {
  it("returns false for 4xx errors regardless of failure count", () => {
    expect(shouldRetry(0, { status: 404 })).toBe(false);
    expect(shouldRetry(1, { status: 401 })).toBe(false);
    expect(shouldRetry(2, { status: 422 })).toBe(false);
  });

  it("returns true for network errors below max retry count", () => {
    const networkError = new Error("Network Error");
    expect(shouldRetry(0, networkError)).toBe(true);
    expect(shouldRetry(1, networkError)).toBe(true);
    expect(shouldRetry(2, networkError)).toBe(true);
  });

  it("returns false when failure count reaches max (3)", () => {
    const networkError = new Error("Network Error");
    expect(shouldRetry(3, networkError)).toBe(false);
  });

  it("returns false for 5xx errors when max retries reached", () => {
    expect(shouldRetry(3, { status: 503 })).toBe(false);
  });

  it("returns true for 5xx errors below max retry count", () => {
    expect(shouldRetry(0, { status: 503 })).toBe(true);
    expect(shouldRetry(2, { status: 502 })).toBe(true);
  });
});

// ─── flaky network integration tests ──────────────────────────────────────

describe("QueryProvider — flaky network retries", () => {
  it("retries and succeeds when query fails then recovers", async () => {
    let callCount = 0;

    function FlakyComponent() {
      const { data, status } = useQuery({
        queryKey: ["flaky"],
        queryFn: () => {
          callCount += 1;
          if (callCount < 3) {
            return Promise.reject(new Error("Network Error"));
          }
          return Promise.resolve("recovered");
        },
        retryDelay: 0,
      });

      return <div data-testid="flaky-status">{status === "success" ? data : status}</div>;
    }

    render(
      <QueryProvider>
        <FlakyComponent />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("flaky-status")).toHaveTextContent("recovered"), {
      timeout: 5_000,
    });

    expect(callCount).toBe(3);
  });

  it("does not retry a 4xx error", async () => {
    const queryFn = vi.fn().mockRejectedValue({ status: 404 });

    function ClientErrorComponent() {
      const { status } = useQuery({
        queryKey: ["client-error"],
        queryFn,
        retryDelay: 0,
      });

      return <div data-testid="error-status">{status}</div>;
    }

    render(
      <QueryProvider>
        <ClientErrorComponent />
      </QueryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("error-status")).toHaveTextContent("error"));

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
