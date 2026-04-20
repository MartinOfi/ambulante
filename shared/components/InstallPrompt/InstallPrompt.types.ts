export const INSTALL_PLATFORM = {
  ios: "ios",
  android: "android",
  unknown: "unknown",
} as const;

export type InstallPlatform = (typeof INSTALL_PLATFORM)[keyof typeof INSTALL_PLATFORM];

export interface InstallPromptProps {
  readonly platform: InstallPlatform;
  readonly isInstalled: boolean;
  readonly canTriggerNativePrompt: boolean;
  readonly onTriggerNativePrompt: () => void;
  readonly onDismiss: () => void;
}

// Non-standard Chromium API — typed locally to avoid global pollution
export interface BeforeInstallPromptEvent extends Event {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
}
