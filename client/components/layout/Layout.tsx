import { useCallback, useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { Table2, Folder, Copy, DatabaseZap, ToyBrick } from "lucide-react";
import { useBrickStatus } from "@/lib/useBrickStatus";
import { BrickUpDialog } from "@/components/BrickUpDialog";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout() {
  const [tables, setTables] = useState<string[]>([]);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showBrickDialog, setShowBrickDialog] = useState(false);
  const [pingDismissed, setPingDismissed] = useState(false);
  const navigate = useNavigate();
  const { bricked, refresh: refreshBrickStatus } = useBrickStatus();

  const showPing = bricked === false && !pingDismissed;

  const loadDb = useCallback(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        if (!config.dbPath) {
          navigate("/setup");
          return;
        }
        setDbPath(config.dbPath);
        return fetch("/api/tables");
      })
      .then((r) => r?.json())
      .then((tableList) => {
        if (tableList && !tableList.error) {
          setTables(tableList);
        }
      });
  }, [navigate]);

  useEffect(() => {
    loadDb();
  }, [loadDb]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tables[index]) {
          navigate(`/table/${tables[index]}`);
        }
      }

      if (e.key === "s" && e.metaKey && !e.altKey) {
        e.preventDefault();
        setCollapsed((c) => !c);
      }

      if (e.key === "," && e.metaKey) {
        e.preventDefault();
        navigate("/settings");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate]);

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          "border-r bg-card flex flex-col transition-[width] duration-200",
          collapsed ? "w-14" : "w-64",
        )}
      >
        {!collapsed && (
          <div className="border-b">
            <DropdownMenu onOpenChange={(open) => { if (open && showPing) setPingDismissed(true); }}>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center justify-between w-full cursor-pointer px-3 py-2.5 focus:outline-none"
                  title={dbPath ?? undefined}
                >
                  <span className="flex items-center gap-2">
                    {showPing && (
                      <span className="flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                      </span>
                    )}
                    <img
                      src="/with-text.svg"
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
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      <Folder className="h-3.5 w-3.5" />
                      ../{dbPath.split("/").pop()}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {bricked === false && (
                  <DropdownMenuItem onClick={() => setShowBrickDialog(true)}>
                    <span className="relative mr-2">
                      <ToyBrick className="h-3.5 w-3.5" />
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
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
                <DropdownMenuItem onClick={() => navigate("/setup")}>
                  <DatabaseZap className="h-3.5 w-3.5 mr-2" />
                  Change database
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <nav className="flex-1 overflow-auto p-2 space-y-1">
          <TooltipProvider delayDuration={300}>
            {tables.map((table) => (
              <Tooltip key={table} open={collapsed ? undefined : false}>
                <TooltipTrigger asChild>
                  <div>
                    <NavLink
                      to={`/table/${table}`}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "ring-1 ring-primary text-primary"
                            : "text-muted-foreground hover:ring-1 hover:ring-ring",
                          collapsed && "justify-center px-0",
                        )
                      }
                    >
                      <Table2 className="h-4 w-4 shrink-0" />
                      {!collapsed && table}
                    </NavLink>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{table}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </aside>

      <main className="flex-1 min-h-0">
        <Outlet
          context={{ collapsed, setCollapsed, bricked, refreshBrickStatus }}
        />
      </main>

      {showBrickDialog && dbPath && (
        <BrickUpDialog
          dbPath={dbPath}
          onClose={() => setShowBrickDialog(false)}
          onBricked={() => {
            setShowBrickDialog(false);
            refreshBrickStatus();
            loadDb();
          }}
        />
      )}
    </div>
  );
}
