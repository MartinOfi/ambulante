import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilePage } from "./ProfilePage";
import { LOCATION_PERMISSION_STATUS, NOTIFICATION_PERMISSION } from "@/features/profile/constants";
import type { NotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";
import type { ProfilePageProps } from "./ProfilePage.types";

const defaultPrefs: NotificationPrefs = {
  orderUpdates: false,
  storeArrival: false,
  marketing: false,
};

const defaultProps: ProfilePageProps = {
  displayName: "Juan García",
  email: "juan@example.com",
  locationStatus: LOCATION_PERMISSION_STATUS.PROMPT,
  notificationPermission: NOTIFICATION_PERMISSION.DEFAULT,
  prefs: defaultPrefs,
  onRequestLocation: async () => {},
  onTogglePref: () => {},
  onRequestNotificationPermission: async () => {},
  onSignOut: async () => {},
};

describe("ProfilePage", () => {
  it("renders the user display name", () => {
    render(<ProfilePage {...defaultProps} />);
    expect(screen.getByText("Juan García")).toBeInTheDocument();
  });

  it("renders the user email", () => {
    render(<ProfilePage {...defaultProps} />);
    expect(screen.getByText("juan@example.com")).toBeInTheDocument();
  });

  it("renders the location permissions section", () => {
    render(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /ubicación/i })).toBeInTheDocument();
  });

  it("renders the notifications section", () => {
    render(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /notificaciones/i })).toBeInTheDocument();
  });

  it("renders a sign out button", () => {
    render(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it("shows 'Invitado' as fallback when displayName is undefined", () => {
    render(<ProfilePage {...defaultProps} displayName={undefined} />);
    expect(screen.getByText("Invitado")).toBeInTheDocument();
  });
});
