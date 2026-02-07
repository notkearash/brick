import { useCallback, useEffect, useState } from "react";

export type TableColor = "none" | "orange" | "purple" | "cyan";
export type TableIcon = "table" | "grid" | "list" | "people";

export interface TablePref {
  color?: TableColor;
  icon?: TableIcon;
}

type TablePrefs = Record<string, TablePref>;

const DEFAULTS: Record<string, string> = { color: "none", icon: "table" };

export function useTablePrefs(bricked: boolean | null) {
  const [prefs, setPrefs] = useState<TablePrefs>({});

  const load = useCallback(() => {
    if (bricked !== true) {
      setPrefs({});
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
          if (!row.scope) continue;
          if (row.key !== "color" && row.key !== "icon") continue;
          if (!map[row.scope]) map[row.scope] = {};
          (map[row.scope] as any)[row.key] = row.value;
        }
        setPrefs(map);
      })
      .catch(() => setPrefs({}));
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
        const next = { ...prev };
        if (Object.keys(merged).length === 0) {
          delete next[table];
        } else {
          next[table] = merged;
        }
        return next;
      });

      for (const [key, value] of Object.entries(update)) {
        if (value === DEFAULTS[key]) {
          await fetch("/api/brick/preferences", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, scope: table }),
          });
        } else {
          await fetch("/api/brick/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, scope: table, value }),
          });
        }
      }
    },
    [],
  );

  return { prefs, setPref };
}
