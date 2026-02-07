import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { Table2, Folder, Copy, DatabaseZap } from "lucide-react";
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
  const navigate = useNavigate();

  useEffect(() => {
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
        {!collapsed && <div className="border-b px-4 py-3 flex items-center gap-2">
          <img src="/with-text.svg" alt="Brick" className="h-6" />
          {dbPath && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 ml-auto"
                  title={dbPath}
                >
                  <Folder className="h-3.5 w-3.5" />
                  <span>../{dbPath.split("/").pop()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(dbPath)}>
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copy full path
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/setup")}>
                  <DatabaseZap className="h-3.5 w-3.5 mr-2" />
                  Change database
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>}
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
                <TooltipContent side="right">
                  {table}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </aside>

      <main className="flex-1 min-h-0">
        <Outlet context={{ collapsed, setCollapsed }} />
      </main>
    </div>
  );
}
