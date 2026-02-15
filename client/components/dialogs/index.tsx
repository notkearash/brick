import { Card } from "@/components/ui/card";

interface DialogShellProps {
  children: React.ReactNode;
  onClose: () => void;
  loading?: boolean;
}

export function DialogShell({ children, onClose, loading }: DialogShellProps) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}
