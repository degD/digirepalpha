export type ColorScheme = "light" | "dark";

export interface AppPreferences {
  colorScheme: ColorScheme;
}

export interface PreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PREFERENCES_STORAGE_KEY = "digirepalpha.preferences";

export const DEFAULT_PREFERENCES: AppPreferences = {
  colorScheme: "light",
};

function getBrowserStorage(): PreferencesStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === "light" || value === "dark";
}

export function loadPreferences(
  storage = getBrowserStorage(),
): AppPreferences {
  if (!storage) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const savedPreferences = storage.getItem(PREFERENCES_STORAGE_KEY);

    if (!savedPreferences) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed: unknown = JSON.parse(savedPreferences);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_PREFERENCES };
    }

    const { colorScheme } = parsed as Record<string, unknown>;

    return {
      colorScheme: isColorScheme(colorScheme)
        ? colorScheme
        : DEFAULT_PREFERENCES.colorScheme,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(
  preferences: AppPreferences,
  storage = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences are best-effort; a write failure must not break the UI.
  }
}
