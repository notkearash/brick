import { useEffect } from "react";
import { Card } from "@/components/ui/card";

interface DialogShellProps {
  children: React.ReactNode;
  onClose: () => void;
  loading?: boolean;
}

export function DialogShell({ children, onClose, loading }: DialogShellProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}
