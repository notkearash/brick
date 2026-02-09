import { NavLink } from "react-router";
import { Settings, Lock, Pencil } from "lucide-react";
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
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full cursor-pointer",
          editMode
            ? "text-primary"
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
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "text-primary"
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
