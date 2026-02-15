import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import type { CalendarEvent } from "@/components/calendar";
import {
  CalendarToolbar,
  type CalendarViewMode,
} from "@/components/calendar/CalendarToolbar";
import { DayView } from "@/components/calendar/DayView";
import { EventDialog } from "@/components/calendar/EventDialog";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import type { LayoutContext } from "@/components/layout/Layout";

export function CalendarView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed, editMode } =
    useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  useEffect(() => {
    if (tableName) setCurrentDate(new Date());
  }, [tableName]);

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "month") {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return {
        startDate: startOfWeek(ms).toISOString(),
        endDate: endOfWeek(me).toISOString(),
      };
    }
    if (viewMode === "week") {
      return {
        startDate: startOfWeek(currentDate).toISOString(),
        endDate: endOfWeek(currentDate).toISOString(),
      };
    }
    return {
      startDate: startOfDay(currentDate).toISOString(),
      endDate: endOfDay(currentDate).toISOString(),
    };
  }, [currentDate, viewMode]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar", tableName, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: "1000",
      });
      const res = await fetch(`/api/tables/${tableName}?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.rows as CalendarEvent[];
    },
    enabled: !!tableName,
  });

  const events = data ?? [];

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["calendar", tableName] }),
    [queryClient, tableName],
  );

  const handlePrev = useCallback(() => {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  function handleDateClick(date: Date) {
    if (editMode) {
      setCreateDate(date);
      setShowCreateEvent(true);
    } else {
      setCurrentDate(date);
      setViewMode("day");
    }
  }

  function handleTimeSlotClick(date: Date) {
    if (editMode) {
      setCreateDate(date);
      setShowCreateEvent(true);
    }
  }

  function handleEventClick(event: CalendarEvent) {
    if (editMode) {
      setSelectedEvent(event);
    }
  }

  const label = useMemo(() => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      if (ws.getMonth() === we.getMonth()) {
        return `${format(ws, "MMM d")} - ${format(we, "d, yyyy")}`;
      }
      return `${format(ws, "MMM d")} - ${format(we, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate, viewMode]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "r" && e.metaKey) {
        e.preventDefault();
        invalidate();
        return;
      }
      if (e.key === "[") handlePrev();
      else if (e.key === "]") handleNext();
      else if (e.key === "t") handleToday();
      else if (e.key === "m") setViewMode("month");
      else if (e.key === "w") setViewMode("week");
      else if (e.key === "d") setViewMode("day");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [invalidate, handlePrev, handleNext, handleToday]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar
        label={label}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        eventCount={events.length}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c: boolean) => !c)}
        editMode={editMode}
        onAdd={() => {
          setCreateDate(new Date());
          setShowCreateEvent(true);
        }}
        onRefresh={invalidate}
      />

      <div className="flex-1 min-h-0">
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
        {viewMode === "day" && (
          <DayView
            currentDate={currentDate}
            events={events}
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {showCreateEvent && tableName && (
        <EventDialog
          tableName={tableName}
          defaultDate={createDate}
          onClose={() => {
            setShowCreateEvent(false);
            setCreateDate(null);
          }}
          onSaved={() => {
            setShowCreateEvent(false);
            setCreateDate(null);
            invalidate();
          }}
        />
      )}

      {selectedEvent && tableName && (
        <EventDialog
          tableName={tableName}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSaved={() => {
            setSelectedEvent(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}
