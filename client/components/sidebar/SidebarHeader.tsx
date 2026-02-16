import { Copy, DatabaseZap, Folder, ToyBrick } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  dbPath: string | null;
  bricked: boolean | null;
  showPing: boolean;
  onPingDismiss: () => void;
  onShowBrickDialog: () => void;
  onChangeDb: () => void;
}

export function SidebarHeader({
  dbPath,
  bricked,
  showPing,
  onPingDismiss,
  onShowBrickDialog,
  onChangeDb,
}: SidebarHeaderProps) {
  return (
    <div className="border-b h-10 shrink-0">
      <DropdownMenu
        onOpenChange={(open) => {
          if (open && showPing) onPingDismiss();
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex items-center gap-2 w-full h-full cursor-pointer px-3 focus:outline-none"
            title={dbPath ?? undefined}
          >
            <span className="flex items-center gap-2">
              {showPing && (
                <span className="flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              )}
              <img
                src="/no-text.svg"
                alt="Brick"
                className={cn(
                  "h-6 transition-opacity",
                  bricked === false
                    ? "opacity-40 grayscale group-hover:opacity-70"
                    : "opacity-60 group-hover:opacity-100",
                )}
              />
            </span>
            {dbPath && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                <Folder className="h-3.5 w-3.5" />
                ../{dbPath.split("/").pop()}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {bricked === false && (
            <DropdownMenuItem onClick={onShowBrickDialog}>
              <span className="relative mr-2">
                <ToyBrick className="h-3.5 w-3.5" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              Brick it up
            </DropdownMenuItem>
          )}
          {dbPath && (
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(dbPath)}
            >
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy full path
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onChangeDb}>
            <DatabaseZap className="h-3.5 w-3.5 mr-2" />
            Change database
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
