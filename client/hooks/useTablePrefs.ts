import { useCallback, useEffect, useState } from "react";

export type TableColor = "none" | "orange" | "purple" | "cyan";
export type TableIcon =
  | "table"
  | "grid"
  | "list"
  | "people"
  | "calendar"
  | "calendar-days"
  | "calendar-check"
  | "calendar-clock"
  | "file-text";

export type ViewType = "table" | "calendar" | "document";

const VIEW_ROUTES: Record<ViewType, string> = {
  table: "/table",
  calendar: "/calendar",
  document: "/document",
};

export function getViewRoute(viewType?: ViewType): string {
  return VIEW_ROUTES[viewType ?? "table"] ?? "/table";
}

export interface TablePref {
  color?: TableColor;
  icon?: TableIcon;
  viewType?: ViewType;
  displayName?: string;
}

type TablePrefs = Record<string, TablePref>;

const DEFAULTS: Record<string, string> = {
  color: "none",
  icon: "table",
  view_type: "table",
};

export function useTablePrefs(bricked: boolean | null) {
  const [prefs, setPrefs] = useState<TablePrefs>({});
  const [tableOrder, setTableOrderState] = useState<string[]>([]);

  const load = useCallback(() => {
    if (bricked !== true) {
      setPrefs({});
      setTableOrderState([]);
      return;
    }
    fetch("/api/brick/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (!data.preferences) return;
        const map: TablePrefs = {};
        for (const row of data.preferences as {
          key: string;
          scope: string;
          value: string;
        }[]) {
          if (row.key === "table_order" && !row.scope) {
            try {
              setTableOrderState(JSON.parse(row.value));
            } catch {}
            continue;
          }
          if (!row.scope) continue;
          if (row.key === "view_type") {
            if (!map[row.scope]) map[row.scope] = {};
            map[row.scope].viewType = row.value as ViewType;
            continue;
          }
          if (row.key === "display_name") {
            if (!map[row.scope]) map[row.scope] = {};
            map[row.scope].displayName = row.value;
            continue;
          }
          if (row.key !== "color" && row.key !== "icon") continue;
          if (!map[row.scope]) map[row.scope] = {};
          (map[row.scope] as Record<string, string>)[row.key] = row.value;
        }
        setPrefs(map);
      })
      .catch(() => {
        setPrefs({});
      });
  }, [bricked]);

  useEffect(() => {
    load();
  }, [load]);

  const setPref = useCallback(
    async (table: string, update: Partial<TablePref>) => {
      setPrefs((prev) => {
        const existing = prev[table] || {};
        const merged = { ...existing, ...update };
        if (merged.color === "none") delete merged.color;
        if (merged.icon === "table") delete merged.icon;
        if (merged.viewType === "table") delete merged.viewType;
        const next = { ...prev };
        if (Object.keys(merged).length === 0) {
          delete next[table];
        } else {
          next[table] = merged;
        }
        return next;
      });

      const KEY_MAP: Record<string, string> = {
        viewType: "view_type",
        displayName: "display_name",
      };
      for (const [key, value] of Object.entries(update)) {
        const apiKey = KEY_MAP[key] || key;
        if (value === DEFAULTS[apiKey]) {
          await fetch("/api/brick/preferences", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: apiKey, scope: table }),
          });
        } else {
          await fetch("/api/brick/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: apiKey, scope: table, value }),
          });
        }
      }
    },
    [],
  );

  const setTableOrder = useCallback((order: string[]) => {
    setTableOrderState(order);
    fetch("/api/brick/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "table_order",
        value: JSON.stringify(order),
      }),
    });
  }, []);

  return { prefs, setPref, tableOrder, setTableOrder, refresh: load };
}
