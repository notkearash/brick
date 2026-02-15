import {
  eachHourOfInterval,
  format,
  isSameDay,
  isToday,
  parseISO,
  setHours,
  startOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from ".";
import { getEventClasses, HOUR_HEIGHT, isAllDay } from ".";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayView({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick,
}: DayViewProps) {
  const hours = eachHourOfInterval({
    start: setHours(startOfDay(currentDate), 0),
    end: setHours(startOfDay(currentDate), 23),
  });

  const allDayEvents = events.filter(isAllDay);
  const timedEvents = events.filter((e) => !isAllDay(e));
  const today = isToday(currentDate);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {allDayEvents.length > 0 && (
        <div className="border-b shrink-0">
          <div className="grid grid-cols-[3rem_1fr]">
            <div className="text-[10px] text-muted-foreground p-1">all-day</div>
            <div className="border-l p-0.5 space-y-0.5">
              {allDayEvents.map((event) => (
                <button
                  type="button"
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
          </div>
        </div>
      )}

      <div className="grid grid-cols-[3rem_1fr] border-b shrink-0">
        <div />
        <div
          className={cn(
            "text-center py-1.5 border-l",
            today && "text-primary font-semibold",
          )}
        >
          <div className="text-xs text-muted-foreground">
            {format(currentDate, "EEEE")}
          </div>
          <div
            className={cn(
              "text-lg leading-none mt-0.5 mx-auto h-8 w-8 flex items-center justify-center rounded-full",
              today && "bg-primary text-primary-foreground",
            )}
          >
            {format(currentDate, "d")}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div
          className="grid grid-cols-[3rem_1fr] relative"
          style={{ height: 24 * HOUR_HEIGHT }}
        >
          {hours.map((hour) => (
            <div
              key={hour.toISOString()}
              className="text-[10px] text-muted-foreground text-right pr-1 -translate-y-1/2"
              style={{
                position: "absolute",
                top: hour.getHours() * HOUR_HEIGHT,
                left: 0,
                width: "3rem",
              }}
            >
              {format(hour, "ha").toLowerCase()}
            </div>
          ))}

          <div
            className="relative border-l col-start-2"
            style={{ gridRow: "1 / -1" }}
          >
            {hours.map((hour) => (
              <button
                type="button"
                key={hour.toISOString()}
                className="block w-full border-b border-border/50 cursor-pointer hover:bg-muted/30"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setHours(hour.getHours(), 0, 0, 0);
                  onTimeSlotClick?.(d);
                }}
              />
            ))}

            {today && (
              <div
                className="absolute left-0 right-0 border-t-2 border-primary z-10 pointer-events-none"
                style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
              >
                <div className="w-2 h-2 rounded-full bg-primary -translate-x-1 -translate-y-1" />
              </div>
            )}

            {timedEvents.map((event) => {
              const start = parseISO(event.start_at);
              const end = event.end_at
                ? parseISO(event.end_at)
                : new Date(start.getTime() + 3600000);
              const eventStart = isSameDay(start, currentDate)
                ? start.getHours() * 60 + start.getMinutes()
                : 0;
              const eventEnd = isSameDay(end, currentDate)
                ? end.getHours() * 60 + end.getMinutes()
                : 1440;
              const top = (eventStart / 60) * HOUR_HEIGHT;
              const height = Math.max(
                ((eventEnd - eventStart) / 60) * HOUR_HEIGHT,
                20,
              );

              return (
                <button
                  type="button"
                  key={event.id}
                  className={cn(
                    "absolute left-1 right-1 rounded px-2 py-1 text-xs leading-tight overflow-hidden cursor-pointer z-5",
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
                    <div className="opacity-70">
                      {format(start, "h:mm a")}{" "}
                      {event.end_at && `- ${format(end, "h:mm a")}`}
                    </div>
                  )}
                  {height > 50 && event.description && (
                    <div className="opacity-60 mt-0.5 truncate">
                      {event.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
