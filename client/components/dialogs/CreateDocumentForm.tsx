import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CreateDocumentFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (title: string) => void;
  onBack: () => void;
  backLabel: string;
}

export function CreateDocumentForm({
  loading,
  error,
  onSubmit,
  onBack,
  backLabel,
}: CreateDocumentFormProps) {
  const [title, setTitle] = useState("");

  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg">Create document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="docTitle" className="text-sm text-muted-foreground">
            Title
          </label>
          <Input
            id="docTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="mt-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit(title.trim() || "Untitled");
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
            onClick={() => onSubmit(title.trim() || "Untitled")}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
