import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X, Table2, Calendar } from "lucide-react";
import { DialogShell } from ".";
import type { ViewType } from "@/hooks/useTablePrefs";
import { cn } from "@/lib/utils";

interface CreateTableDialogProps {
  onClose: () => void;
  onCreated: (name: string, viewType?: ViewType) => void;
  bricked?: boolean | null;
}

interface ColumnDef {
  name: string;
  type: string;
}

type ItemType = "table" | "calendar";

const TYPES = ["TEXT", "INTEGER", "REAL", "BLOB"];

const CALENDAR_SCHEMA = [
  "id INTEGER PRIMARY KEY AUTOINCREMENT",
  "title TEXT NOT NULL",
  "start_at TEXT NOT NULL",
  "end_at TEXT",
  "description TEXT",
  "color TEXT",
];

export function CreateTableDialog({ onClose, onCreated, bricked }: CreateTableDialogProps) {
  const [itemType, setItemType] = useState<ItemType | null>(bricked ? null : "table");
  const [name, setName] = useState("");
  const [autoId, setAutoId] = useState(true);
  const [cols, setCols] = useState<ColumnDef[]>([{ name: "", type: "TEXT" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addColumn() {
    setCols((c) => [...c, { name: "", type: "TEXT" }]);
  }

  function removeColumn(index: number) {
    setCols((c) => c.filter((_, i) => i !== index));
  }

  function updateColumn(index: number, field: keyof ColumnDef, value: string) {
    setCols((c) => c.map((col, i) => (i === index ? { ...col, [field]: value } : col)));
  }

  async function handleSubmitTable() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const columns = [];
    if (autoId) {
      columns.push({ name: "id", type: "INTEGER", pk: true });
    }

    for (const col of cols) {
      const colName = col.name.trim();
      if (colName) {
        columns.push({ name: colName, type: col.type });
      }
    }

    if (columns.length === 0) {
      setError("At least one column is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, columns }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onCreated(trimmedName, "table");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitCalendar() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, type: "calendar" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      await fetch("/api/brick/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "view_type", scope: trimmedName, value: "calendar" }),
      });
      await fetch("/api/brick/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "icon", scope: trimmedName, value: "calendar" }),
      });

      onCreated(trimmedName, "calendar");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Type picker
  if (itemType === null) {
    return (
      <DialogShell onClose={onClose} loading={loading}>
        <CardHeader>
          <CardTitle className="text-lg">New item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            className={cn(
              "w-full flex items-center gap-3 rounded-md border p-3 text-sm font-medium transition-colors",
              "hover:ring-1 hover:ring-ring cursor-pointer text-left",
            )}
            onClick={() => setItemType("table")}
          >
            <Table2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <div>Table</div>
              <div className="text-xs text-muted-foreground font-normal">Custom columns, data grid view</div>
            </div>
          </button>
          <button
            className={cn(
              "w-full flex items-center gap-3 rounded-md border p-3 text-sm font-medium transition-colors",
              "hover:ring-1 hover:ring-ring cursor-pointer text-left",
            )}
            onClick={() => setItemType("calendar")}
          >
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <div>Calendar</div>
              <div className="text-xs text-muted-foreground font-normal">Events with dates, month/week/day views</div>
            </div>
          </button>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </DialogShell>
    );
  }

  // Step 2b: Calendar form
  if (itemType === "calendar") {
    return (
      <DialogShell onClose={onClose} loading={loading}>
        <CardHeader>
          <CardTitle className="text-lg">Create calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Calendar name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my_calendar"
              className="mt-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitCalendar();
              }}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Schema</label>
            <div className="mt-1 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono space-y-0.5">
              {CALENDAR_SCHEMA.map((col) => (
                <div key={col}>{col}</div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setItemType(bricked ? null : "table"); setError(null); }}
              disabled={loading}
            >
              {bricked ? "Back" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitCalendar}
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardFooter>
      </DialogShell>
    );
  }

  // Step 2a: Table form (existing)
  return (
    <DialogShell onClose={onClose} loading={loading}>
      <CardHeader>
        <CardTitle className="text-lg">Create table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Table name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my_table"
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitTable();
            }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => setAutoId((v) => !v)}>
          <span
            className={`h-4 w-4 border flex items-center justify-center shrink-0 ${
              autoId
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40"
            }`}
          >
            {autoId && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/></svg>
            )}
          </span>
          Auto-add <code className="text-xs bg-muted px-1 rounded">id INTEGER PRIMARY KEY</code>
        </label>

        <div>
          <label className="text-sm text-muted-foreground">Columns</label>
          <div className="space-y-2 mt-1">
            {cols.map((col, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={col.name}
                  onChange={(e) => updateColumn(i, "name", e.target.value)}
                  placeholder="column_name"
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitTable();
                  }}
                />
                <select
                  value={col.type}
                  onChange={(e) => updateColumn(i, "type", e.target.value)}
                  className="h-8 bg-background border rounded px-2 text-sm cursor-pointer"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {cols.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeColumn(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 mt-2"
            onClick={addColumn}
          >
            <Plus className="h-3 w-3" />
            Add column
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (bricked) { setItemType(null); setError(null); } else { onClose(); } }}
            disabled={loading}
          >
            {bricked ? "Back" : "Cancel"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitTable}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardFooter>
    </DialogShell>
  );
}
