export interface CalendarEvent {
  id: number;
  title: string;
  start_at: string;
  end_at: string | null;
  description: string | null;
  color: string | null;
}

export const EVENT_COLORS: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400",
  red: "bg-red-500/20 text-red-400",
  green: "bg-green-500/20 text-green-400",
  orange: "bg-orange-500/20 text-orange-400",
  purple: "bg-purple-500/20 text-purple-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
};

export const EVENT_COLOR_NAMES = Object.keys(EVENT_COLORS);

export function getEventClasses(color: string | null): string {
  return EVENT_COLORS[color || "blue"] || EVENT_COLORS.blue;
}
