import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ColumnDef {
  name: string;
  type: string;
}

interface CreateTableFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (
    name: string,
    columns: { name: string; type: string; pk?: boolean }[],
  ) => void;
  onBack: () => void;
  backLabel: string;
}

const TYPES = ["TEXT", "INTEGER", "REAL", "BLOB"];

export function CreateTableForm({
  loading,
  error,
  onSubmit,
  onBack,
  backLabel,
}: CreateTableFormProps) {
  const [name, setName] = useState("");
  const [autoId, setAutoId] = useState(true);
  const [cols, setCols] = useState<ColumnDef[]>([{ name: "", type: "TEXT" }]);

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const columns: { name: string; type: string; pk?: boolean }[] = [];
    if (autoId) {
      columns.push({ name: "id", type: "INTEGER", pk: true });
    }

    for (const col of cols) {
      const colName = col.name.trim();
      if (colName) {
        columns.push({ name: colName, type: col.type });
      }
    }

    if (columns.length === 0) return;
    onSubmit(trimmedName, columns);
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg">Create table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="tableName" className="text-sm text-muted-foreground">
            Table name
          </label>
          <Input
            id="tableName"
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

        <label
          className="flex items-center gap-2 text-sm cursor-pointer"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setAutoId((v) => !v);
            }
          }}
        >
          <input
            type="checkbox"
            checked={autoId}
            onChange={() => setAutoId((v) => !v)}
            className="sr-only"
          />
          <span
            className={`h-4 w-4 border flex items-center justify-center shrink-0 ${
              autoId
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40"
            }`}
          >
            {autoId && <Check className="h-2.5 w-2.5" />}
          </span>
          Auto-add{" "}
          <code className="text-xs bg-muted px-1 rounded">
            id INTEGER PRIMARY KEY
          </code>
        </label>

        <div>
          <span className="text-sm text-muted-foreground">Columns</span>
          <div className="space-y-2 mt-1">
            {cols.map((col, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns have no stable id
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={col.name}
                  onChange={(e) =>
                    setCols((c) =>
                      c.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="column_name"
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />
                <select
                  value={col.type}
                  onChange={(e) =>
                    setCols((c) =>
                      c.map((x, j) =>
                        j === i ? { ...x, type: e.target.value } : x,
                      ),
                    )
                  }
                  className="h-8 bg-background border rounded px-2 text-sm cursor-pointer"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {cols.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setCols((c) => c.filter((_, j) => j !== i))}
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
            onClick={() => setCols((c) => [...c, { name: "", type: "TEXT" }])}
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
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            {backLabel}
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
    </>
  );
}
