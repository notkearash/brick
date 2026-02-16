import { GripVertical } from "lucide-react";
import { NavLink } from "react-router";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getViewRoute,
  type TablePref,
  type ViewType,
} from "@/hooks/useTablePrefs";
import { cn } from "@/lib/utils";
import { COLOR_CLASSES, getTableIcon } from ".";
import { NavItemContextMenu } from "./NavItemContextMenu";

export interface NavItemProps {
  table: string;
  collapsed: boolean;
  bricked: boolean | null;
  editMode: boolean;
  canReorder?: boolean;
  viewType?: ViewType;
  pref: TablePref;
  onSetPref: (update: Partial<TablePref>) => void;
  onDeleteTable: () => void;
  dragHandleRef?: (element: HTMLElement | null) => void;
  dragHandleListeners?: Record<string, unknown>;
}

export function NavItem({
  table,
  collapsed,
  bricked,
  editMode,
  viewType,
  pref,
  onSetPref,
  onDeleteTable,
  dragHandleRef,
  dragHandleListeners,
}: NavItemProps) {
  const color = pref.color || "none";
  const iconType = pref.icon || "table";
  const IconComponent = getTableIcon(iconType);
  const colorClasses = COLOR_CLASSES[color];
  const hasContextMenu = bricked || editMode;
  const showGrip = !!dragHandleRef && !collapsed;
  const linkBase = getViewRoute(viewType);

  const navLink = (
    <NavLink
      to={`${linkBase}/${table}`}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? collapsed
              ? colorClasses.activeCollapsed
              : colorClasses.activeExpanded
            : cn(
                colorClasses.inactive,
                "hover:shadow-[inset_0_2px_8px_rgba(57,57,62,0.5),inset_0_-1px_5px_rgba(57,57,62,0.25)] hover:bg-muted hover:rounded-[10px]",
              ),
          collapsed && "justify-center px-0",
          showGrip && "pr-8",
        )
      }
    >
      <IconComponent
        className="h-4 w-4 shrink-0"
        onClick={
          hasContextMenu && !collapsed
            ? (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                (e.currentTarget as Element)
                  .closest("[data-ctx]")
                  ?.dispatchEvent(
                    new MouseEvent("contextmenu", {
                      bubbles: true,
                      cancelable: true,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    }),
                  );
              }
            : undefined
        }
      />
      {!collapsed && (pref.displayName || table)}
    </NavLink>
  );

  const gripHandle = showGrip ? (
    <div
      ref={dragHandleRef}
      className="absolute right-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      {...dragHandleListeners}
    >
      <GripVertical className="h-3.5 w-3.5" />
    </div>
  ) : null;

  if (!hasContextMenu) {
    return (
      <Tooltip open={collapsed ? undefined : false}>
        <TooltipTrigger asChild>
          <div data-ctx className="relative">
            {navLink}
            {gripHandle}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {pref.displayName || table}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <ContextMenu>
      <Tooltip open={collapsed ? undefined : false}>
        <ContextMenuTrigger asChild>
          <TooltipTrigger asChild>
            <div data-ctx className="relative">
              {navLink}
              {gripHandle}
            </div>
          </TooltipTrigger>
        </ContextMenuTrigger>
        <TooltipContent side="right">
          {pref.displayName || table}
        </TooltipContent>
      </Tooltip>
      <NavItemContextMenu
        bricked={bricked}
        editMode={editMode}
        color={color}
        iconType={iconType}
        viewType={viewType}
        onSetPref={onSetPref}
        onDeleteTable={onDeleteTable}
      />
    </ContextMenu>
  );
}
