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

interface DeleteTableDialogProps {
  tableName: string;
  displayName?: string;
  skipConfirm?: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteTableDialog({
  tableName,
  displayName,
  skipConfirm,
  onClose,
  onDeleted,
}: DeleteTableDialogProps) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = displayName || tableName;
  const canDelete = skipConfirm || confirm === tableName;

  async function handleDelete() {
    if (!canDelete) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tables/${tableName}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogShell onClose={onClose} loading={loading}>
      <CardHeader>
        <CardTitle className="text-lg text-destructive">
          Delete {skipConfirm ? "document" : "table"}
        </CardTitle>
        <CardDescription>
          This will permanently delete{" "}
          <code className="text-xs font-semibold">{label}</code> and all its
          data. This cannot be undone.
        </CardDescription>
      </CardHeader>
      {!skipConfirm && (
        <CardContent>
          <label
            htmlFor="delete-confirm"
            className="text-sm text-muted-foreground"
          >
            Type <code className="text-xs font-semibold">{tableName}</code> to
            confirm
          </label>
          <Input
            id="delete-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={tableName}
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canDelete) handleDelete();
            }}
          />
        </CardContent>
      )}
      <CardFooter className="justify-between">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading || !canDelete}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardFooter>
    </DialogShell>
  );
}
