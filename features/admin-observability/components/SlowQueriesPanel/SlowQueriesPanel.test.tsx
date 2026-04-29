import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlowQueriesPanel } from "./SlowQueriesPanel";
import type { SlowQuery } from "@/shared/types/observability";

const mockQueries: SlowQuery[] = [
  {
    calls: 100,
    totalExecTimeMs: 5000.25,
    meanExecTimeMs: 50.0,
    queryText: "select * from orders",
  },
  {
    calls: 5,
    totalExecTimeMs: 1200.0,
    meanExecTimeMs: 240.0,
    queryText: "select * from products where id = $1",
  },
];

describe("SlowQueriesPanel", () => {
  it("renders loading state", () => {
    render(<SlowQueriesPanel queries={[]} isLoading error={null} />);
    expect(screen.getByText(/cargando queries lentas/i)).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(<SlowQueriesPanel queries={[]} isLoading={false} error="Error obteniendo queries." />);
    expect(screen.getByText("Error obteniendo queries.")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<SlowQueriesPanel queries={[]} isLoading={false} error={null} />);
    expect(screen.getByText(/no se encontraron queries lentas/i)).toBeInTheDocument();
  });

  it("renders table with query rows", () => {
    render(<SlowQueriesPanel queries={mockQueries} isLoading={false} error={null} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("select * from orders")).toBeInTheDocument();
    expect(screen.getByText("select * from products where id = $1")).toBeInTheDocument();
  });

  it("displays rank numbers starting from 1", () => {
    render(<SlowQueriesPanel queries={mockQueries} isLoading={false} error={null} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("formats mean time in milliseconds", () => {
    render(<SlowQueriesPanel queries={mockQueries} isLoading={false} error={null} />);
    expect(screen.getByText("50.0ms")).toBeInTheDocument();
    expect(screen.getByText("240.0ms")).toBeInTheDocument();
  });

  it("formats large times in seconds", () => {
    const longQuery: SlowQuery = {
      calls: 1,
      totalExecTimeMs: 3500.0,
      meanExecTimeMs: 3500.0,
      queryText: "slow query",
    };
    render(<SlowQueriesPanel queries={[longQuery]} isLoading={false} error={null} />);
    expect(screen.getAllByText("3.50s")).toHaveLength(2);
  });

  it("truncates long query text", () => {
    const longQuery: SlowQuery = {
      calls: 1,
      totalExecTimeMs: 100,
      meanExecTimeMs: 100,
      queryText: "x".repeat(200),
    };
    render(<SlowQueriesPanel queries={[longQuery]} isLoading={false} error={null} />);
    const cell = screen.getByTitle("x".repeat(200));
    expect(cell.textContent).toMatch(/…$/);
  });
});
