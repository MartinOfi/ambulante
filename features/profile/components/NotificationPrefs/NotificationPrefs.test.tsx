import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils";
import { NotificationPrefs } from "./NotificationPrefs";
import { NOTIFICATION_PERMISSION } from "@/features/profile/constants";
import type { NotificationPrefs as NotificationPrefsType } from "@/features/profile/hooks/useNotificationPrefs";

const defaultPrefs: NotificationPrefsType = {
  orderUpdates: false,
  storeArrival: false,
  marketing: false,
};

describe("NotificationPrefs", () => {
  it("renders all three pref toggles", () => {
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.GRANTED}
        onToggle={vi.fn()}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.getByText(/pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/llegada/i)).toBeInTheDocument();
    expect(screen.getByText(/marketing/i)).toBeInTheDocument();
  });

  it("shows 'Activar notificaciones' button when permission is default", () => {
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.DEFAULT}
        onToggle={vi.fn()}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /activar notificaciones/i })).toBeInTheDocument();
  });

  it("does not show activate button when permission is already granted", () => {
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.GRANTED}
        onToggle={vi.fn()}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /activar notificaciones/i }),
    ).not.toBeInTheDocument();
  });

  it("shows disabled toggles and message when permission is denied", () => {
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.DENIED}
        onToggle={vi.fn()}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.getByText(/denegadas/i)).toBeInTheDocument();
  });

  it("calls onToggle with the correct key when a switch is clicked", () => {
    const onToggle = vi.fn();
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.GRANTED}
        onToggle={onToggle}
        onRequestPermission={vi.fn()}
      />,
    );

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]);
    expect(onToggle).toHaveBeenCalledWith("orderUpdates");
  });

  it("calls onRequestPermission when activate button is clicked", () => {
    const onRequestPermission = vi.fn();
    renderWithProviders(
      <NotificationPrefs
        prefs={defaultPrefs}
        notificationPermission={NOTIFICATION_PERMISSION.DEFAULT}
        onToggle={vi.fn()}
        onRequestPermission={onRequestPermission}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /activar notificaciones/i }));
    expect(onRequestPermission).toHaveBeenCalledOnce();
  });
});
