import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CreateCalendarFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (name: string) => void;
  onBack: () => void;
  backLabel: string;
}

export function CreateCalendarForm({ loading, error, onSubmit, onBack, backLabel }: CreateCalendarFormProps) {
  const [name, setName] = useState("");

  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg">Create calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Calendar name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my_calendar"
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
            }}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            {backLabel}
          </Button>
          <Button
            size="sm"
            onClick={() => onSubmit(name.trim())}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
