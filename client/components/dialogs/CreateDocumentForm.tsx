import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreateDocumentFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
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
  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg">Create document</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A new document will be created. The title becomes the table name.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            {backLabel}
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardFooter>
    </>
  );
}
