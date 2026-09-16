import { PREFERENCES_STORAGE_KEY, type ColorScheme } from "./preferences";

export const DARK_CLASS = "dark";

export const COLOR_SCHEME_EVENT = "digirepalpha:color-scheme";

export const THEME_COLORS: Record<ColorScheme, string> = {
  light: "#ffffff",
  dark: "#0b0b0f",
};

export function applyColorScheme(scheme: ColorScheme, doc: Document): void {
  const root = doc.documentElement;

  root.classList.toggle(DARK_CLASS, scheme === "dark");
  root.style.colorScheme = scheme;

  const themeColor = doc.querySelector('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.setAttribute("content", THEME_COLORS[scheme]);
  }

  doc.dispatchEvent(new Event(COLOR_SCHEME_EVENT));
}

export function readColorScheme(doc: Document): ColorScheme {
  return doc.documentElement.classList.contains(DARK_CLASS) ? "dark" : "light";
}

export function colorSchemeInitScript(): string {
  const storageKey = JSON.stringify(PREFERENCES_STORAGE_KEY);

  return `(function(){try{var p=localStorage.getItem(${storageKey});var s=p&&JSON.parse(p).colorScheme;var t=s==="dark"?"dark":"light";var e=document.documentElement;if(t==="dark")e.classList.add("dark");e.style.colorScheme=t;}catch(e){}})();`;
}
