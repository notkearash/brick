import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { Table2, Folder } from "lucide-react";
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
        {!collapsed && <div className="border-b px-4 py-3">
          <img src="/with-text.svg" alt="Brick" className="h-8" />
          {dbPath && (
            <button
              onClick={() => navigate("/setup")}
              className="flex items-center gap-2 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors truncate w-full cursor-pointer"
              title={dbPath}
            >
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                .../{dbPath.split("/").slice(-2).join("/")}
              </span>
            </button>
          )}
        </div>}
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
                    ? "ring-1 ring-primary text-primary"
                    : "text-muted-foreground hover:ring-1 hover:ring-ring",
                  collapsed && "justify-center px-0",
                )
              }
            >
              <Table2 className="h-4 w-4 shrink-0" />
              {!collapsed && table}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-h-0">
        <Outlet context={{ collapsed, setCollapsed }} />
      </main>
    </div>
  );
}
