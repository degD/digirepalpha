import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import type { ColorScheme } from "./preferences";

export async function syncSystemBars(scheme: ColorScheme): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SystemBars.setStyle({
      style: scheme === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch {
    // System bars are cosmetic; ignore failures on unsupported platforms.
  }
}
