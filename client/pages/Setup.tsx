import { useState } from "react";
import { useNavigate } from "react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Setup() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const pickFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] },
        ],
      });

      if (!selected) return;

      setError("");
      setLoading(true);

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbPath: selected }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to open database");
        return;
      }

      navigate("/");
    } catch (e) {
      setError("Failed to open file picker");
    } finally {
      setLoading(false);
    }
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
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
