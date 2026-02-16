import { Lock, Pencil, Settings } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  editMode: boolean;
  onToggleEditMode: () => void;
}

export function SidebarFooter({
  collapsed,
  editMode,
  onToggleEditMode,
}: SidebarFooterProps) {
  return (
    <div className="border-t p-2 space-y-1">
      <button
        type="button"
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all w-full cursor-pointer",
          editMode
            ? collapsed
              ? "ring-1 ring-primary text-primary rounded-[6px]"
              : "bg-sidebar text-foreground rounded-[10px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12),inset_0_-1px_4px_rgba(0,0,0,0.06)]"
            : "text-muted-foreground opacity-60 hover:opacity-100",
          collapsed && "justify-center px-0",
        )}
        onClick={onToggleEditMode}
        title={editMode ? "Editing (⌘E)" : "Read-only (⌘E)"}
      >
        {editMode ? (
          <Pencil className="h-4 w-4 shrink-0" />
        ) : (
          <Lock className="h-4 w-4 shrink-0" />
        )}
        {!collapsed && (editMode ? "Editing" : "Read-only")}
      </button>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all",
            isActive
              ? collapsed
                ? "ring-1 ring-primary text-primary rounded-[6px]"
                : "bg-sidebar text-foreground rounded-[10px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12),inset_0_-1px_4px_rgba(0,0,0,0.06)]"
              : "text-muted-foreground opacity-60 hover:opacity-100",
            collapsed && "justify-center px-0",
          )
        }
      >
        <Settings className="h-4 w-4 shrink-0" />
        {!collapsed && "Settings"}
      </NavLink>
    </div>
  );
}
