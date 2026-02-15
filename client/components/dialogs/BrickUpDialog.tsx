import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DialogShell } from ".";

const isTauri = !!(window as unknown as Record<string, unknown>)
  .__TAURI_INTERNALS__;

interface BrickUpDialogProps {
  dbPath: string;
  onClose: () => void;
  onBricked: () => void;
}

function defaultCopyPath(dbPath: string): string {
  const dot = dbPath.lastIndexOf(".");
  if (dot === -1) return `${dbPath}-bricked`;
  return `${dbPath.slice(0, dot)}-bricked${dbPath.slice(dot)}`;
}

async function doCopyAndBrick(destPath: string): Promise<void> {
  const res = await fetch("/api/brick/up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "copy", destPath }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
}

export function BrickUpDialog({
  dbPath,
  onClose,
  onBricked,
}: BrickUpDialogProps) {
  const [mode, setMode] = useState<"choose" | "copy">("choose");
  const [destPath, setDestPath] = useState(() => defaultCopyPath(dbPath));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOverwrite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brick/up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "overwrite" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onBricked();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyTauri() {
    setLoading(true);
    setError(null);
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const picked = await save({
        defaultPath: defaultCopyPath(dbPath),
        filters: [{ name: "SQLite", extensions: ["db", "sqlite", "sqlite3"] }],
      });
      if (!picked) {
        setLoading(false);
        return;
      }
      await doCopyAndBrick(picked);
      onBricked();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyWeb() {
    setLoading(true);
    setError(null);
    try {
      await doCopyAndBrick(destPath);
      onBricked();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogShell onClose={onClose} loading={loading}>
      <CardHeader>
        <CardTitle className="text-lg">Brick this database?</CardTitle>
        <CardDescription>
          Adds a <code className="text-xs">_brick_preferences</code> table to
          store per-database settings. This is invisible and non-destructive.
        </CardDescription>
      </CardHeader>

      {mode === "choose" ? (
        <>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              disabled={loading}
              onClick={handleOverwrite}
            >
              Overwrite
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                — add table to current file
              </span>
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              disabled={loading}
              onClick={isTauri ? handleCopyTauri : () => setMode("copy")}
            >
              Copy &amp; Brick
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                — copy DB then add table
              </span>
            </Button>
          </CardContent>
          <CardFooter className="justify-between">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardContent className="space-y-3">
            <label
              htmlFor="brick-copy-path"
              className="text-sm text-muted-foreground"
            >
              Save copy as:
            </label>
            <Input
              id="brick-copy-path"
              value={destPath}
              onChange={(e) => setDestPath(e.target.value)}
              disabled={loading}
            />
          </CardContent>
          <CardFooter className="justify-between">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode("choose");
                setError(null);
              }}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleCopyWeb}
              disabled={loading || !destPath.trim()}
            >
              Copy &amp; Brick
            </Button>
          </CardFooter>
        </>
      )}
    </DialogShell>
  );
}
