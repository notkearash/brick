import { useEffect } from "react";
import type { NavigateFunction } from "react-router";
import { getViewRoute, type TablePref } from "@/hooks/useTablePrefs";

interface UseKeyboardShortcutsOptions {
  tables: string[];
  navigate: NavigateFunction;
  setCollapsed: (fn: (prev: boolean) => boolean) => void;
  setEditMode: (fn: (prev: boolean) => boolean) => void;
  tablePrefs?: Record<string, TablePref>;
}

export function useKeyboardShortcuts({
  tables,
  navigate,
  setCollapsed,
  setEditMode,
  tablePrefs,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;

      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (tables[index]) {
          const vt = tablePrefs?.[tables[index]]?.viewType;
          navigate(`${getViewRoute(vt)}/${tables[index]}`);
        }
      }

      if (e.key === "s" && e.metaKey && e.shiftKey && !e.altKey) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }

      if (e.key === "s" && e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("brick:force-save"));
      }

      if (e.key === "," && e.metaKey) {
        e.preventDefault();
        navigate("/settings");
      }

      if (e.key === "e" && e.metaKey && !e.shiftKey && !e.altKey) {
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setEditMode((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate, setCollapsed, setEditMode, tablePrefs]);
}
