import { useCallback, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "pk-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

let currentTheme: Theme = getInitialTheme();
const listeners = new Set<() => void>();

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function setTheme(next: Theme) {
  if (next === currentTheme) return;
  currentTheme = next;
  applyTheme(next);
  listeners.forEach((cb) => cb());
}

if (typeof document !== "undefined") {
  applyTheme(currentTheme);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggleTheme, setTheme };
}
