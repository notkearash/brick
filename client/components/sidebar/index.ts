import { Table2, LayoutGrid, List, Users, Calendar, CalendarDays, CalendarCheck, CalendarClock } from "lucide-react";
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
};

export function getTableIcon(iconType: TableIcon) {
  return TABLE_ICONS[iconType] || Table2;
}

export const COLOR_CLASSES: Record<
  TableColor,
  { active: string; inactive: string }
> = {
  none: {
    active: "ring-primary text-primary",
    inactive: "text-muted-foreground",
  },
  orange: {
    active: "ring-orange-400 text-orange-400",
    inactive: "text-orange-400",
  },
  purple: {
    active: "ring-purple-400 text-purple-400",
    inactive: "text-purple-400",
  },
  cyan: {
    active: "ring-cyan-400 text-cyan-400",
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

export const ICON_OPTIONS = TABLE_ICON_OPTIONS;

export { SidebarHeader } from "./SidebarHeader";
export { SidebarFooter } from "./SidebarFooter";
export { NavItem } from "./NavItem";
export { SortableNavItem } from "./SortableNavItem";
