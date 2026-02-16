import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  FileText,
  LayoutGrid,
  List,
  Table2,
  Users,
} from "lucide-react";
import type { TableColor, TableIcon } from "@/hooks/useTablePrefs";

export const TABLE_ICONS: Record<TableIcon, typeof Table2> = {
  table: Table2,
  grid: LayoutGrid,
  list: List,
  people: Users,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "file-text": FileText,
};

export function getTableIcon(iconType: TableIcon) {
  return TABLE_ICONS[iconType] || Table2;
}

export const COLOR_CLASSES: Record<
  TableColor,
  { activeExpanded: string; activeCollapsed: string; inactive: string }
> = {
  none: {
    activeExpanded:
      "bg-sidebar text-foreground rounded-[10px] shadow-[inset_0_2px_8px_rgba(251,191,36,0.5),inset_0_-1px_5px_rgba(251,191,36,0.25)]",
    activeCollapsed: "ring-1 ring-amber-400 text-foreground rounded-[6px]",
    inactive: "text-muted-foreground",
  },
  orange: {
    activeExpanded:
      "bg-sidebar text-orange-400 rounded-[10px] shadow-[inset_0_2px_8px_rgba(251,146,60,0.5),inset_0_-1px_5px_rgba(251,146,60,0.25)]",
    activeCollapsed: "ring-1 ring-orange-400 text-orange-400 rounded-[6px]",
    inactive: "text-orange-400",
  },
  purple: {
    activeExpanded:
      "bg-sidebar text-purple-400 rounded-[10px] shadow-[inset_0_2px_8px_rgba(192,132,252,0.5),inset_0_-1px_5px_rgba(192,132,252,0.25)]",
    activeCollapsed: "ring-1 ring-purple-400 text-purple-400 rounded-[6px]",
    inactive: "text-purple-400",
  },
  cyan: {
    activeExpanded:
      "bg-sidebar text-cyan-400 rounded-[10px] shadow-[inset_0_2px_8px_rgba(34,211,238,0.5),inset_0_-1px_5px_rgba(34,211,238,0.25)]",
    activeCollapsed: "ring-1 ring-cyan-400 text-cyan-400 rounded-[6px]",
    inactive: "text-cyan-400",
  },
};

export const COLOR_VALUES: readonly TableColor[] = [
  "none",
  "orange",
  "purple",
  "cyan",
];

export const TABLE_ICON_OPTIONS = [
  { value: "table" as const, Icon: Table2 },
  { value: "grid" as const, Icon: LayoutGrid },
  { value: "list" as const, Icon: List },
  { value: "people" as const, Icon: Users },
];

export const CALENDAR_ICON_OPTIONS = [
  { value: "calendar" as const, Icon: Calendar },
  { value: "calendar-days" as const, Icon: CalendarDays },
  { value: "calendar-check" as const, Icon: CalendarCheck },
  { value: "calendar-clock" as const, Icon: CalendarClock },
];

export const DOCUMENT_ICON_OPTIONS = [
  { value: "file-text" as const, Icon: FileText },
];

export { NavItem } from "./NavItem";
export { SidebarFooter } from "./SidebarFooter";
export { SidebarHeader } from "./SidebarHeader";
export { SortableNavItem } from "./SortableNavItem";
