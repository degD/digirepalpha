"use client";

import { useEffect } from "react";
import { syncSystemBars } from "../lib/system-bars";
import { applyColorScheme, readColorScheme } from "../lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const scheme = readColorScheme(document);

    applyColorScheme(scheme, document);
    void syncSystemBars(scheme);
  }, []);

  return null;
}
