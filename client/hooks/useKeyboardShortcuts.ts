import { useEffect } from "react";
import type { NavigateFunction } from "react-router";
import { getViewRoute, type TablePref } from "@/hooks/useTablePrefs";

interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  skipInInputs?: boolean;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  tables: string[];
  navigate: NavigateFunction;
  setCollapsed: (fn: (prev: boolean) => boolean) => void;
  setEditMode: (fn: (prev: boolean) => boolean) => void;
  tablePrefs?: Record<string, TablePref>;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts({
  tables,
  navigate,
  setCollapsed,
  setEditMode,
  tablePrefs,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: "s",
        meta: true,
        shift: true,
        action: () => setCollapsed((c) => !c),
      },
      {
        key: "s",
        meta: true,
        action: () => window.dispatchEvent(new CustomEvent("brick:force-save")),
      },
      {
        key: ",",
        meta: true,
        action: () => navigate("/settings"),
      },
      {
        key: "e",
        meta: true,
        skipInInputs: true,
        action: () => setEditMode((m) => !m),
      },
      ...Array.from({ length: 9 }, (_, i) => ({
        key: String(i + 1),
        meta: true,
        action: () => {
          if (tables[i]) {
            const vt = tablePrefs?.[tables[i]]?.viewType;
            navigate(`${getViewRoute(vt)}/${tables[i]}`);
          }
        },
      })),
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;

      for (const s of shortcuts) {
        if (e.key !== s.key) continue;
        if ((s.meta ?? false) !== e.metaKey) continue;
        if ((s.shift ?? false) !== e.shiftKey) continue;
        if ((s.alt ?? false) !== e.altKey) continue;
        if (s.skipInInputs && INPUT_TAGS.has(tag)) continue;

        e.preventDefault();
        s.action();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate, setCollapsed, setEditMode, tablePrefs]);
}
