import {
  Capacitor,
  registerPlugin,
  SystemBars,
  SystemBarsStyle,
} from "@capacitor/core";
import type { ColorScheme } from "./preferences";

interface ThemeBarsPlugin {
  setDarkMode(options: { dark: boolean }): Promise<void>;
}

const ThemeBars = registerPlugin<ThemeBarsPlugin>("ThemeBars");

export async function syncSystemBars(scheme: ColorScheme): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const dark = scheme === "dark";

  try {
    await SystemBars.setStyle({
      style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
    // System bars are cosmetic; ignore failures on unsupported platforms.
  }

  try {
    await ThemeBars.setDarkMode({ dark });
  } catch {
    // The app's native theme is only adjustable on Android.
  }
}
