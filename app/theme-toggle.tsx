"use client";

import { useSyncExternalStore } from "react";
import { savePreferences, type ColorScheme } from "../lib/preferences";
import { syncSystemBars } from "../lib/system-bars";
import {
  applyColorScheme,
  COLOR_SCHEME_EVENT,
  readColorScheme,
} from "../lib/theme";

function subscribe(onChange: () => void) {
  window.addEventListener(COLOR_SCHEME_EVENT, onChange);

  return () => window.removeEventListener(COLOR_SCHEME_EVENT, onChange);
}

function getSnapshot(): ColorScheme {
  return readColorScheme(document);
}

function getServerSnapshot(): ColorScheme {
  return "light";
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20 14.5a8 8 0 1 1-10.5-9 6.5 6.5 0 0 0 10.5 9z" />
    </svg>
  );
}

export function ThemeToggle() {
  const scheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function handleToggle() {
    const next: ColorScheme =
      readColorScheme(document) === "dark" ? "light" : "dark";

    applyColorScheme(next, document);
    savePreferences({ colorScheme: next });
    void syncSystemBars(next);
  }

  return (
    <button
      aria-label={
        scheme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:outline-zinc-100"
      onClick={handleToggle}
      type="button"
    >
      <span className="inline-flex dark:hidden">
        <MoonIcon />
      </span>
      <span className="hidden dark:inline-flex">
        <SunIcon />
      </span>
    </button>
  );
}
