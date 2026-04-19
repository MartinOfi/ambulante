import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LocationPermission } from "./LocationPermission";
import { LOCATION_PERMISSION_STATUS } from "@/features/profile/constants";

describe("LocationPermission", () => {
  const noop = vi.fn();

  it("shows 'Activar' button when status is prompt", () => {
    render(<LocationPermission status={LOCATION_PERMISSION_STATUS.PROMPT} onRequest={noop} />);
    expect(screen.getByRole("button", { name: /activar/i })).toBeInTheDocument();
  });

  it("shows granted state text when permission is granted", () => {
    render(<LocationPermission status={LOCATION_PERMISSION_STATUS.GRANTED} onRequest={noop} />);
    expect(screen.getByText(/activa/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /activar/i })).not.toBeInTheDocument();
  });

  it("shows denied state message when permission is denied", () => {
    render(<LocationPermission status={LOCATION_PERMISSION_STATUS.DENIED} onRequest={noop} />);
    expect(screen.getByText(/denegada/i)).toBeInTheDocument();
  });

  it("shows unsupported message when API is unavailable", () => {
    render(<LocationPermission status={LOCATION_PERMISSION_STATUS.UNSUPPORTED} onRequest={noop} />);
    expect(screen.getByText(/no disponible/i)).toBeInTheDocument();
  });

  it("calls onRequest when 'Activar' button is clicked", () => {
    const onRequest = vi.fn();
    render(<LocationPermission status={LOCATION_PERMISSION_STATUS.PROMPT} onRequest={onRequest} />);
    fireEvent.click(screen.getByRole("button", { name: /activar/i }));
    expect(onRequest).toHaveBeenCalledOnce();
  });
});
