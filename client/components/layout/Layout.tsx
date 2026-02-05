import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Table2, Settings, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout() {
  const [tables, setTables] = useState<string[]>([]);
  const [dbPath, setDbPath] = useState<string | null>(null);
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
      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tables[index]) {
          navigate(`/table/${tables[index]}`);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate]);

  const dbName = dbPath?.split("/").pop() || "Database";

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="flex h-14 items-center border-b px-4 gap-2">
          <Database className="h-5 w-5" />
          <h1 className="text-lg font-semibold truncate" title={dbPath || ""}>
            {dbName}
          </h1>
        </div>
        <nav className="flex-1 overflow-auto p-2 space-y-1">
          {tables.map((table) => (
            <NavLink
              key={table}
              to={`/table/${table}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Table2 className="h-4 w-4" />
              {table}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2">
          <NavLink
            to="/setup"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <Settings className="h-4 w-4" />
            Change Database
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
