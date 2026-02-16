import { useCallback, useEffect, useState } from "react";

export type OptionColor = "none" | "orange" | "purple" | "cyan";
export const OPTION_COLORS: readonly OptionColor[] = [
  "none",
  "orange",
  "purple",
  "cyan",
];

export const COLOR_CLASSES: Record<OptionColor, { dot: string; badge: string; hover: string }> = {
  none: { dot: "", badge: "bg-muted", hover: "hover:bg-accent hover:text-accent-foreground" },
  orange: { dot: "bg-orange-400", badge: "bg-orange-400/15 text-orange-600 dark:text-orange-400", hover: "hover:bg-orange-400/15" },
  purple: { dot: "bg-purple-400", badge: "bg-purple-400/15 text-purple-600 dark:text-purple-400", hover: "hover:bg-purple-400/15" },
  cyan: { dot: "bg-cyan-400", badge: "bg-cyan-400/15 text-cyan-600 dark:text-cyan-400", hover: "hover:bg-cyan-400/15" },
};

export interface ColumnOption {
  value: string;
  color: OptionColor;
}

type ColumnOptionsMap = Record<string, ColumnOption[]>;

// backwards compat: old format was string[], new format is ColumnOption[]
function normalize(raw: unknown): ColumnOptionsMap {
  if (!raw || typeof raw !== "object") return {};
  const map: ColumnOptionsMap = {};
  for (const [col, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      map[col] = val.map((v) =>
        typeof v === "string"
          ? { value: v, color: "none" as OptionColor }
          : (v as ColumnOption),
      );
    }
  }
  return map;
}

export function useColumnOptions(tableName?: string, bricked?: boolean | null) {
  const [options, setOptions] = useState<ColumnOptionsMap>({});

  const load = useCallback(() => {
    if (!tableName || bricked !== true) {
      setOptions({});
      return;
    }
    fetch(`/api/brick/preferences?scope=${encodeURIComponent(tableName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.preferences) return;
        for (const row of data.preferences as {
          key: string;
          scope: string;
          value: string;
        }[]) {
          if (row.key === "column_options" && row.scope === tableName) {
            try {
              setOptions(normalize(JSON.parse(row.value)));
            } catch {
              setOptions({});
            }
            return;
          }
        }
        setOptions({});
      })
      .catch(() => setOptions({}));
  }, [tableName, bricked]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next: ColumnOptionsMap) => {
      setOptions(next);
      await fetch("/api/brick/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "column_options",
          scope: tableName,
          value: JSON.stringify(next),
        }),
      });
    },
    [tableName],
  );

  const setColumnOptions = useCallback(
    async (column: string, values: ColumnOption[]) => {
      const next = { ...options };
      if (values.length === 0) {
        delete next[column];
      } else {
        next[column] = values;
      }
      await save(next);
    },
    [options, save],
  );

  return { columnOptions: options, setColumnOptions };
}
