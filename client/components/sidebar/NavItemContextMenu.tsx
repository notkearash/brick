import { Ban, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { TableColor, TableIcon, TablePref, ViewType } from "@/hooks/useTablePrefs";
import { COLOR_VALUES, TABLE_ICON_OPTIONS, CALENDAR_ICON_OPTIONS } from ".";

interface NavItemContextMenuProps {
  bricked: boolean | null;
  editMode: boolean;
  color: TableColor;
  iconType: TableIcon;
  viewType?: ViewType;
  onSetPref: (update: Partial<TablePref>) => void;
  onDeleteTable: () => void;
}

export function NavItemContextMenu({
  bricked,
  editMode,
  color,
  iconType,
  viewType,
  onSetPref,
  onDeleteTable,
}: NavItemContextMenuProps) {
  const iconOptions = viewType === "calendar" ? CALENDAR_ICON_OPTIONS : TABLE_ICON_OPTIONS;
  return (
    <ContextMenuContent className="px-2 py-1.5 min-w-0">
      {bricked && (
        <>
          <ContextMenuLabel className="px-0 py-0 pb-1 text-xs text-center">
            Tag
          </ContextMenuLabel>
          <div className="flex gap-2 justify-center pb-1.5">
            {COLOR_VALUES.map((c) => (
              <button
                key={c}
                className={cn(
                  "h-7 w-7 flex items-center justify-center cursor-pointer transition-opacity",
                  color === c ? "" : "opacity-40 hover:opacity-100",
                )}
                onClick={() => onSetPref({ color: c as TableColor })}
              >
                {c === "none" ? (
                  <Ban
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground",
                      color === c && "ring-2 ring-ring rounded-full",
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full",
                      c === "orange" && "bg-orange-400",
                      c === "purple" && "bg-purple-400",
                      c === "cyan" && "bg-cyan-400",
                      color === c &&
                        "ring-2 ring-offset-2 ring-offset-popover ring-ring",
                    )}
                  />
                )}
              </button>
            ))}
          </div>
          <ContextMenuSeparator className="mx-0" />
          <ContextMenuLabel className="px-0 py-0 pt-1.5 pb-1 text-xs text-center">
            Icon
          </ContextMenuLabel>
          <div className="flex gap-2 justify-center">
            {iconOptions.map(({ value, Icon }) => (
              <button
                key={value}
                className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-all",
                  iconType === value
                    ? cn(
                        "bg-muted",
                        color === "orange"
                          ? "text-orange-400"
                          : color === "purple"
                            ? "text-purple-400"
                            : color === "cyan"
                              ? "text-cyan-400"
                              : "text-foreground",
                      )
                    : "text-muted-foreground/40 hover:text-muted-foreground",
                )}
                onClick={() => onSetPref({ icon: value as TableIcon })}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </>
      )}
      {editMode && (
        <>
          {bricked && <ContextMenuSeparator className="mx-0" />}
          <ContextMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
            onClick={onDeleteTable}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete table
          </ContextMenuItem>
        </>
      )}
    </ContextMenuContent>
  );
}
