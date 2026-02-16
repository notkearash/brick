import { useRef, useState } from "react";
import { Ban, ChevronsUpDown, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COLOR_CLASSES, OPTION_COLORS, type ColumnOption, type OptionColor } from "@/hooks/useColumnOptions";
import { cn } from "@/lib/utils";
import { DialogShell } from ".";

interface ColumnOptionsDialogProps {
  column: string;
  currentOptions: ColumnOption[];
  onSave: (column: string, options: ColumnOption[]) => void;
  onClose: () => void;
}

export function ColumnOptionsDialog({
  column,
  currentOptions,
  onSave,
  onClose,
}: ColumnOptionsDialogProps) {
  const [options, setOptions] = useState<ColumnOption[]>(currentOptions);
  const [input, setInput] = useState("");
  const [colorPicking, setColorPicking] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addOption() {
    const val = input.trim();
    if (!val || options.some((o) => o.value === val)) return;
    setOptions([...options, { value: val, color: "none" }]);
    setInput("");
    inputRef.current?.focus();
  }

  function setColor(index: number, color: OptionColor) {
    setOptions(options.map((o, i) => (i === index ? { ...o, color } : o)));
    setColorPicking(null);
  }

  return (
    <DialogShell onClose={onClose}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Dropdown</CardTitle>
            <CardDescription className="text-xs">
              Configure options for{" "}
              <code className="font-semibold text-foreground/70">{column}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {options.length > 0 && (
          <div className="rounded-md border divide-y">
            {options.map((opt, i) => (
              <div
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 group relative"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                <button
                  type="button"
                  className="shrink-0 cursor-pointer"
                  onClick={() =>
                    setColorPicking(colorPicking === i ? null : i)
                  }
                >
                  {opt.color === "none" ? (
                    <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                  ) : (
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        COLOR_CLASSES[opt.color].dot,
                      )}
                    />
                  )}
                </button>
                <span className="text-sm flex-1 truncate">{opt.value}</span>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive cursor-pointer p-0.5"
                  onClick={() =>
                    setOptions(options.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
                {colorPicking === i && (
                  <div className="absolute left-6 top-full mt-0.5 z-10 flex gap-1.5 bg-popover border rounded-md p-1.5 shadow-md">
                    {OPTION_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={cn(
                          "h-5 w-5 flex items-center justify-center cursor-pointer rounded-full transition-opacity",
                          opt.color === c ? "" : "opacity-40 hover:opacity-100",
                        )}
                        onClick={() => setColor(i, c)}
                      >
                        {c === "none" ? (
                          <Ban
                            className={cn(
                              "h-3 w-3 text-muted-foreground",
                              opt.color === c &&
                                "ring-2 ring-ring rounded-full",
                            )}
                          />
                        ) : (
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full",
                              COLOR_CLASSES[c].dot,
                              opt.color === c &&
                                "ring-2 ring-offset-1 ring-offset-popover ring-ring",
                            )}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="New option..."
              className="w-full h-8 bg-transparent text-sm px-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={addOption}
            disabled={!input.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 pt-0">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSave(column, options);
            onClose();
          }}
        >
          Save
        </Button>
      </CardFooter>
    </DialogShell>
  );
}
