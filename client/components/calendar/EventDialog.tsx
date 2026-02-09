import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

function toLocalDatetime(d: Date): string {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
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
  const [startAt, setStartAt] = useState(() => {
    if (event?.start_at) return event.start_at.slice(0, 16);
    if (defaultDate) return toLocalDatetime(defaultDate);
    return toLocalDatetime(new Date());
  });
  const [endAt, setEndAt] = useState(() => {
    if (event?.end_at) return event.end_at.slice(0, 16);
    return "";
  });
  const [description, setDescription] = useState(event?.description ?? "");
  const [color, setColor] = useState(event?.color ?? "blue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || !startAt) return;

    setLoading(true);
    setError(null);

    const body: Record<string, string | null> = {
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
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
    if (!confirm("Delete this event?")) return;

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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Start</label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              End (optional)
            </label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="mt-1"
            />
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
          {isEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          )}
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
            disabled={loading || !title.trim() || !startAt}
          >
            {loading ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </CardFooter>
    </DialogShell>
  );
}
