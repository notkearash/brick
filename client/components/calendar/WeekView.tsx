import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  setHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from ".";
import { getEventClasses, getEventsForDay, isAllDay, HOUR_HEIGHT } from ".";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function WeekView({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = eachHourOfInterval({
    start: setHours(startOfDay(currentDate), 0),
    end: setHours(startOfDay(currentDate), 23),
  });

  const allDayEvents = events.filter(isAllDay);
  const timedEvents = events.filter((e) => !isAllDay(e));

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {allDayEvents.length > 0 && (
        <div className="border-b shrink-0">
          <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
            <div className="text-[10px] text-muted-foreground p-1">all-day</div>
            {days.map((day) => {
              const dayAllDay = getEventsForDay(allDayEvents, day);
              return (
                <div
                  key={day.toISOString()}
                  className="border-l p-0.5 space-y-0.5"
                >
                  {dayAllDay.map((event) => (
                    <button
                      key={event.id}
                      className={cn(
                        "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer",
                        getEventClasses(event.color),
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b shrink-0">
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "text-center py-1.5 border-l",
              isToday(day) && "text-primary font-semibold",
            )}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "text-sm leading-none mt-0.5 mx-auto h-6 w-6 flex items-center justify-center rounded-full",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div
          className="grid grid-cols-[3rem_repeat(7,1fr)] relative"
          style={{ height: 24 * HOUR_HEIGHT }}
        >
          {hours.map((hour) => (
            <div
              key={hour.toISOString()}
              className="text-[10px] text-muted-foreground text-right pr-1 -translate-y-1/2 col-start-1"
              style={{
                gridRow: `${hour.getHours() + 1}`,
                position: "absolute",
                top: hour.getHours() * HOUR_HEIGHT,
                left: 0,
                width: "3rem",
              }}
            >
              {format(hour, "ha").toLowerCase()}
            </div>
          ))}

          {days.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className="relative border-l"
              style={{ gridColumn: dayIndex + 2, gridRow: "1 / -1" }}
            >
              {hours.map((hour) => (
                <div
                  key={hour.toISOString()}
                  className="border-b border-border/50 cursor-pointer hover:bg-muted/30"
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => {
                    const d = new Date(day);
                    d.setHours(hour.getHours(), 0, 0, 0);
                    onTimeSlotClick?.(d);
                  }}
                />
              ))}

              {isToday(day) && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-primary z-10 pointer-events-none"
                  style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary -translate-x-1 -translate-y-1" />
                </div>
              )}

              {getEventsForDay(timedEvents, day)
                .filter((e) => !isAllDay(e))
                .map((event) => {
                  const start = parseISO(event.start_at);
                  const end = event.end_at
                    ? parseISO(event.end_at)
                    : new Date(start.getTime() + 3600000);
                  const eventStart = isSameDay(start, day)
                    ? start.getHours() * 60 + start.getMinutes()
                    : 0;
                  const eventEnd = isSameDay(end, day)
                    ? end.getHours() * 60 + end.getMinutes()
                    : 1440;
                  const top = (eventStart / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    ((eventEnd - eventStart) / 60) * HOUR_HEIGHT,
                    20,
                  );

                  return (
                    <button
                      key={event.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-pointer z-[5]",
                        getEventClasses(event.color),
                      )}
                      style={{ top, height }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={event.title}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {height > 30 && (
                        <div className="opacity-70 truncate">
                          {format(start, "h:mm a")}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
