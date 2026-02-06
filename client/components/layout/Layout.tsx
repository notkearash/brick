import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  Table2,
  Settings,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate]);

  const dbName = dbPath?.split("/").pop() || "Database";

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          "border-r bg-card flex flex-col transition-[width] duration-200",
          collapsed ? "w-14" : "w-64",
        )}
      >
        <div className="flex h-14 items-center border-b px-4 gap-2 justify-between">
          {!collapsed && (
            <>
              <Database className="h-5 w-5 shrink-0" />
              <h1
                className="text-lg font-semibold truncate flex-1"
                title={dbPath || ""}
              >
                {dbName}
              </h1>
            </>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-auto p-2 space-y-1">
          {tables.map((table) => (
            <NavLink
              key={table}
              to={`/table/${table}`}
              title={collapsed ? table : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0",
                )
              }
            >
              <Table2 className="h-4 w-4 shrink-0" />
              {!collapsed && table}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2">
          <NavLink
            to="/setup"
            title={collapsed ? "Change Database" : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-0",
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && "Change Database"}
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
