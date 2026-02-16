import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DialogShellProps {
  children: React.ReactNode;
  onClose: () => void;
  loading?: boolean;
}

export function DialogShell({ children, onClose, loading }: DialogShellProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true));
  }, []);

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setTimeout(onClose, 200);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading]);

  return (
    <div
      role="presentation"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-200",
        open ? "bg-black/30" : "bg-black/0",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <Card
        className={cn(
          "w-full max-w-md transition-all duration-200",
          open
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0",
        )}
      >
        {children}
      </Card>
    </div>
  );
}
