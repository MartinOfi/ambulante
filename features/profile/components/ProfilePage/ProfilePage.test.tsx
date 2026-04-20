import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/shared/test-utils";
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
    renderWithProviders(<ProfilePage {...defaultProps} />);
    expect(screen.getByText("Juan García")).toBeInTheDocument();
  });

  it("renders the user email", () => {
    renderWithProviders(<ProfilePage {...defaultProps} />);
    expect(screen.getByText("juan@example.com")).toBeInTheDocument();
  });

  it("renders the location permissions section", () => {
    renderWithProviders(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /ubicación/i })).toBeInTheDocument();
  });

  it("renders the notifications section", () => {
    renderWithProviders(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /notificaciones/i })).toBeInTheDocument();
  });

  it("renders a sign out button", () => {
    renderWithProviders(<ProfilePage {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it("shows 'Invitado' as fallback when displayName is undefined", () => {
    renderWithProviders(<ProfilePage {...defaultProps} displayName={undefined} />);
    expect(screen.getByText("Invitado")).toBeInTheDocument();
  });

  it("shows unsupported message when notification permission is unsupported", () => {
    renderWithProviders(
      <ProfilePage
        {...defaultProps}
        notificationPermission={NOTIFICATION_PERMISSION.UNSUPPORTED}
      />,
    );
    expect(screen.getByText(/no están disponibles en este dispositivo/i)).toBeInTheDocument();
  });
});
