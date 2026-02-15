import { useQuery } from "@tanstack/react-query";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router";
import { TipTapEditor } from "@/components/document/TipTapEditor";
import type { LayoutContext } from "@/components/layout/Layout";
import { type DocRow, useDocumentEditor } from "@/hooks/useDocumentEditor";

function bodyRowsToHtml(rows: DocRow[]): string {
  const body = rows
    .filter((r) => !r.is_title)
    .sort((a, b) => a.position - b.position);
  if (!body.length) return "<p></p>";
  return body.map((row) => row.content).join("");
}

export function DocumentView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed } = useOutletContext<LayoutContext>();

  const { status, title, onTitleChange, onEditorUpdate, initFromRows } =
    useDocumentEditor(tableName);

  const { data, isLoading, error } = useQuery({
    queryKey: ["document", tableName],
    queryFn: async () => {
      const res = await fetch(`/api/tables/${tableName}?limit=10000`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.rows as DocRow[];
    },
    enabled: !!tableName,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (data) initFromRows(data);
  }, [data, initFromRows]);

  const initialBody = useMemo(() => {
    if (!data) return "";
    return bodyRowsToHtml(data);
  }, [data]);

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
      <div className="flex items-center gap-2 px-2 border-b h-10 shrink-0">
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={() => setCollapsed((c: boolean) => !c)}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1" />
        <span
          className={`text-xs ${
            status === "saved"
              ? "text-muted-foreground"
              : status === "saving"
                ? "text-muted-foreground animate-pulse"
                : "text-orange-400"
          }`}
        >
          {status === "saved"
            ? "Saved"
            : status === "saving"
              ? "Saving..."
              : "Unsaved"}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-3xl font-bold bg-transparent outline-none border-none mb-4 placeholder:text-muted-foreground/40"
          />
          {data && (
            <TipTapEditor
              initialContent={initialBody}
              onUpdate={onEditorUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
