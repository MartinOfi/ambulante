import { create } from "zustand";
import { persist } from "zustand/middleware";

// Storage key as a constant to avoid magic strings (CLAUDE.md §6.2)
const UI_STORE_STORAGE_KEY = "ambulante-ui-preferences" as const;

// Valid theme values — typed union to prevent invalid assignments
export type Theme = "light" | "dark" | "system";

// Split into State + Actions interfaces (Zustand best practice for TS inference)
interface UIPreferencesState {
  readonly theme: Theme;
  readonly isSidebarOpen: boolean;
}

interface UIPreferencesActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

type UIStore = UIPreferencesState & UIPreferencesActions;

const INITIAL_STATE: UIPreferencesState = {
  theme: "light",
  isSidebarOpen: true,
};

/**
 * Global UI preferences store.
 *
 * Persisted to localStorage so theme/sidebar preferences survive page reloads.
 * Consumers should import `useUIStore` and select only what they need to
 * minimise re-renders:
 *
 * @example
 * const theme = useUIStore((state) => state.theme);
 * const setTheme = useUIStore((state) => state.setTheme);
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setTheme: (theme) =>
        set((state) => ({ ...state, theme })),

      toggleSidebar: () =>
        set((state) => ({ ...state, isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (isOpen) =>
        set((state) => ({ ...state, isSidebarOpen: isOpen })),
    }),
    {
      name: UI_STORE_STORAGE_KEY,
      // Persist only the state slice — actions are re-created on each mount
      partialize: (state): UIPreferencesState => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);
