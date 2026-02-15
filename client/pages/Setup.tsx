import { useQueryClient } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { Folder, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RECENTS_KEY = "brick-recent-dbs";
const MAX_RECENTS = 3;

function getRecents(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(stored) ? stored.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function addRecent(path: string) {
  const recents = getRecents().filter((p) => p !== path);
  recents.unshift(path);
  localStorage.setItem(
    RECENTS_KEY,
    JSON.stringify(recents.slice(0, MAX_RECENTS)),
  );
}

function removeRecent(path: string) {
  const recents = getRecents().filter((p) => p !== path);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

export function Setup() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState(getRecents);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const openDb = async (path: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbPath: path }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to open database");
        return;
      }

      addRecent(path);
      queryClient.invalidateQueries();
      navigate("/");
    } catch {
      setError("Failed to open database");
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] },
        ],
      });

      if (!selected) return;
      await openDb(selected);
    } catch {
      setError("Failed to open file picker");
    }
  };

  const handleRemove = (path: string) => {
    removeRecent(path);
    setRecents(getRecents());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/no-text.svg" alt="Brick" className="h-16" />
          </div>
          <CardTitle>Brick</CardTitle>
          <CardDescription>SQLite database browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={pickFile} className="w-full" disabled={loading}>
            {loading ? "Opening..." : "Select Database"}
          </Button>

          {recents.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Recent</p>
              {recents.map((path) => (
                <div key={path} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openDb(path)}
                    disabled={loading}
                    className="flex-1 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1.5 hover:ring-1 hover:ring-ring cursor-pointer truncate text-left"
                    title={path}
                  >
                    <Folder className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">../{path.split("/").pop()}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(path)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:ring-1 hover:ring-ring cursor-pointer shrink-0"
                    title="Remove from recents"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
