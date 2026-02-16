import { FILTER_OPERATORS, type FilterCondition } from "@shared/filters";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface FilterRowProps {
  filter: FilterCondition;
  schema: SchemaColumn[];
  onChange: (patch: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

export function FilterRow({
  filter,
  schema,
  onChange,
  onRemove,
}: FilterRowProps) {
  const op = FILTER_OPERATORS.find((o) => o.value === filter.op);
  const needsValue = op?.needsValue ?? true;

  return (
    <div className="flex items-center gap-1.5 px-2 h-8 border-b shrink-0">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide w-10">
        where
      </span>

      <Select
        value={filter.column}
        onValueChange={(v) => onChange({ column: v })}
      >
        <SelectTrigger className="h-6 text-xs border rounded px-1.5 w-auto min-w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {schema.map((col) => (
            <SelectItem key={col.name} value={col.name} className="text-xs">
              {col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.op}
        onValueChange={(v) => onChange({ op: v as FilterCondition["op"] })}
      >
        <SelectTrigger className="h-6 text-xs border rounded px-1.5 w-auto min-w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value} className="text-xs">
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        <Input
          value={filter.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={filter.op === "in" ? "val1, val2, ..." : "value"}
          className="h-6 text-xs font-mono w-40"
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
