import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "week" | "day";

interface CalendarToolbarProps {
  label: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  eventCount: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  editMode?: boolean;
  onAdd?: () => void;
  onRefresh?: () => void;
}

export function CalendarToolbar({
  label,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  eventCount,
  sidebarCollapsed,
  onToggleSidebar,
  editMode,
  onAdd,
  onRefresh,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-2 h-10 shrink-0">
      <div className="flex items-center gap-0.5">
        {onToggleSidebar && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleSidebar}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onPrev}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onToday}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNext}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <span className="text-sm font-medium ml-2">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </span>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="flex bg-muted rounded-md p-0.5">
          {(["month", "week", "day"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              className={cn(
                "px-2 py-0.5 text-xs rounded cursor-pointer transition-colors capitalize",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onViewModeChange(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {editMode && onAdd && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </>
        )}

        {onRefresh && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
