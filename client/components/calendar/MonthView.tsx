import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from ".";
import { getEventClasses } from ".";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_EVENTS = 3;

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const start = parseISO(event.start_at);
    const end = event.end_at ? parseISO(event.end_at) : start;
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return start <= dayEnd && end >= dayStart;
  });
}

export function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1.5 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b last:border-r-0 p-1 min-h-0 overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "bg-muted/20",
              )}
              onClick={() => onDateClick?.(day)}
            >
              <div
                className={cn(
                  "text-xs font-medium mb-0.5 h-5 w-5 flex items-center justify-center rounded-full",
                  today && "bg-primary text-primary-foreground",
                  !today && !isCurrentMonth && "text-muted-foreground/50",
                  !today && isCurrentMonth && "text-foreground",
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                  <button
                    key={event.id}
                    className={cn(
                      "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer",
                      getEventClasses(event.color),
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                ))}
                {overflow > 0 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{overflow} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
