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

export const HOUR_HEIGHT = 48;

export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : start;
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return start <= dayEnd && end >= dayStart;
  });
}

export function isAllDay(event: CalendarEvent): boolean {
  if (!event.end_at) return false;
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return end.getTime() - start.getTime() >= 1440 * 60000;
}
