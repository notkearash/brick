import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DialogShell } from "@/components/dialogs";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from ".";
import { EVENT_COLOR_NAMES, EVENT_COLORS } from ".";

interface EventDialogProps {
  tableName: string;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  onClose: () => void;
  onSaved: () => void;
}

function toTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, 0, 0);
  return result;
}

export function EventDialog({
  tableName,
  event,
  defaultDate,
  onClose,
  onSaved,
}: EventDialogProps) {
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    if (event?.start_at) return new Date(event.start_at);
    if (defaultDate) return defaultDate;
    return new Date();
  });
  const [startTime, setStartTime] = useState(() => {
    if (event?.start_at) return toTimeString(new Date(event.start_at));
    if (defaultDate) return toTimeString(defaultDate);
    return toTimeString(new Date());
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    if (event?.end_at) return new Date(event.end_at);
    return undefined;
  });
  const [endTime, setEndTime] = useState(() => {
    if (event?.end_at) return toTimeString(new Date(event.end_at));
    return "";
  });
  const [description, setDescription] = useState(event?.description ?? "");
  const [color, setColor] = useState(event?.color ?? "blue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave() {
    if (!title.trim() || !startDate) return;

    setLoading(true);
    setError(null);

    const body: Record<string, string | null> = {
      title: title.trim(),
      start_at: combineDateAndTime(startDate, startTime).toISOString(),
      end_at:
        endDate && endTime
          ? combineDateAndTime(endDate, endTime).toISOString()
          : null,
      description: description.trim() || null,
      color,
    };

    try {
      const url = isEdit
        ? `/api/tables/${tableName}/${event!.id}`
        : `/api/tables/${tableName}`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tables/${tableName}/${event.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(data.error || "Failed");
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogShell onClose={onClose} loading={loading}>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEdit ? "Edit event" : "New event"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleSave();
            }}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Start</label>
            <div className="flex gap-2 mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!startDate}
                    className="data-[empty=true]:text-muted-foreground flex-1 justify-start text-left font-normal gap-2"
                  >
                    <CalendarIcon className="size-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              End (optional)
            </label>
            <div className="flex gap-2 mt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!endDate}
                    className="data-[empty=true]:text-muted-foreground flex-1 justify-start text-left font-normal gap-2"
                  >
                    <CalendarIcon className="size-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            className="mt-1 w-full min-h-15 bg-background border rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Color</label>
          <div className="flex gap-2 mt-1.5">
            {EVENT_COLOR_NAMES.map((c) => (
              <button
                key={c}
                className={cn(
                  "h-6 w-6 rounded-full cursor-pointer transition-all",
                  c === "blue" && "bg-blue-500",
                  c === "red" && "bg-red-500",
                  c === "green" && "bg-green-500",
                  c === "orange" && "bg-orange-500",
                  c === "purple" && "bg-purple-500",
                  c === "cyan" && "bg-cyan-500",
                  color === c
                    ? "ring-2 ring-offset-2 ring-offset-popover ring-ring"
                    : "opacity-50 hover:opacity-100",
                )}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isEdit && (confirmingDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Delete?</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                disabled={loading}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !title.trim() || !startDate}
          >
            {loading ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </CardFooter>
    </DialogShell>
  );
}
