import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, FileText, Table2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ViewType } from "@/hooks/useTablePrefs";
import { cn } from "@/lib/utils";
import { DialogShell } from ".";
import { CreateCalendarForm } from "./CreateCalendarForm";
import { CreateDocumentForm } from "./CreateDocumentForm";
import { CreateTableForm } from "./CreateTableForm";

interface CreateTableDialogProps {
  onClose: () => void;
  onCreated: (name: string, viewType?: ViewType) => void;
  bricked?: boolean | null;
}

type ItemType = "table" | "calendar" | "document";

async function createTable(body: Record<string, unknown>) {
  const res = await fetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

async function setPreferences(scope: string, prefs: Record<string, string>) {
  await Promise.all(
    Object.entries(prefs).map(([key, value]) =>
      fetch("/api/brick/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, scope, value }),
      }),
    ),
  );
}

export function CreateTableDialog({
  onClose,
  onCreated,
  bricked,
}: CreateTableDialogProps) {
  const [itemType, setItemType] = useState<ItemType | null>(
    bricked ? null : "table",
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      body,
      prefs,
    }: {
      body: Record<string, unknown>;
      prefs?: { scope: string; values: Record<string, string> };
    }) => {
      await createTable(body);
      if (prefs) await setPreferences(prefs.scope, prefs.values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  const loading = mutation.isPending;
  const error = mutation.error?.message ?? null;
  const backLabel = bricked ? "Back" : "Cancel";

  function goBack() {
    if (bricked) {
      setItemType(null);
      mutation.reset();
    } else {
      onClose();
    }
  }

  if (itemType === null) {
    return (
      <DialogShell onClose={onClose} loading={loading}>
        <CardHeader>
          <CardTitle className="text-lg">New item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                type: "table" as const,
                icon: Table2,
                label: "Table",
                desc: "Custom columns, data grid",
              },
              {
                type: "calendar" as const,
                icon: Calendar,
                label: "Calendar",
                desc: "Events with dates",
              },
              {
                type: "document" as const,
                icon: FileText,
                label: "Document",
                desc: "Rich text notes",
              },
            ].map(({ type, icon: Icon, label, desc }) => (
              <button
                type="button"
                key={type}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border p-4 text-sm font-medium transition-colors",
                  "hover:ring-1 hover:ring-ring cursor-pointer",
                )}
                onClick={() => setItemType(type)}
              >
                <Icon className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <div>{label}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </CardFooter>
      </DialogShell>
    );
  }

  return (
    <DialogShell onClose={onClose} loading={loading}>
      {itemType === "table" && (
        <CreateTableForm
          loading={loading}
          error={error}
          backLabel={backLabel}
          onBack={goBack}
          onSubmit={async (name, columns) => {
            await mutation.mutateAsync({ body: { name, columns } });
            onCreated(name, "table");
          }}
        />
      )}
      {itemType === "calendar" && (
        <CreateCalendarForm
          loading={loading}
          error={error}
          backLabel={backLabel}
          onBack={goBack}
          onSubmit={async (name) => {
            await mutation.mutateAsync({
              body: { name, type: "calendar" },
              prefs: {
                scope: name,
                values: { view_type: "calendar", icon: "calendar" },
              },
            });
            onCreated(name, "calendar");
          }}
        />
      )}
      {itemType === "document" && (
        <CreateDocumentForm
          loading={loading}
          error={error}
          backLabel={backLabel}
          onBack={goBack}
          onSubmit={async () => {
            const docName = `doc_${Date.now()}`;
            await mutation.mutateAsync({
              body: { name: docName, type: "document" },
              prefs: {
                scope: docName,
                values: {
                  view_type: "document",
                  icon: "file-text",
                  display_name: "Untitled",
                },
              },
            });
            onCreated(docName, "document");
          }}
        />
      )}
    </DialogShell>
  );
}
