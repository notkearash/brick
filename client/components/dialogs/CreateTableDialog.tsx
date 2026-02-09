import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { DialogShell } from ".";

interface CreateTableDialogProps {
  onClose: () => void;
  onCreated: (name: string) => void;
}

interface ColumnDef {
  name: string;
  type: string;
}

const TYPES = ["TEXT", "INTEGER", "REAL", "BLOB"];

export function CreateTableDialog({ onClose, onCreated }: CreateTableDialogProps) {
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

  async function handleSubmit() {
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
      onCreated(trimmedName);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

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
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoId}
            onChange={(e) => setAutoId(e.target.checked)}
            className="accent-primary"
          />
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
                    if (e.key === "Enter") handleSubmit();
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardFooter>
    </DialogShell>
  );
}
