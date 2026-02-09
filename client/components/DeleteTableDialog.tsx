import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DeleteTableDialogProps {
  tableName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteTableDialog({ tableName, onClose, onDeleted }: DeleteTableDialogProps) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirm !== tableName) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tables/${tableName}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onDeleted();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Delete table</CardTitle>
          <CardDescription>
            This will permanently drop <code className="text-xs font-semibold">{tableName}</code> and all its data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="text-sm text-muted-foreground">
            Type <code className="text-xs font-semibold">{tableName}</code> to confirm
          </label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={tableName}
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && confirm === tableName) handleDelete();
            }}
          />
        </CardContent>
        <CardFooter className="justify-between">
          <div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={loading || confirm !== tableName}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
