import { useCallback, useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { Table2, LayoutGrid, List, Folder, Copy, DatabaseZap, ToyBrick, Users, Ban, Settings, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useBrickStatus } from "@/lib/useBrickStatus";
import { BrickUpDialog } from "@/components/BrickUpDialog";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { DeleteTableDialog } from "@/components/DeleteTableDialog";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useTablePrefs,
  type TableColor,
  type TableIcon,
} from "@/lib/useTablePrefs";

export function Layout() {
  const [tables, setTables] = useState<string[]>([]);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showBrickDialog, setShowBrickDialog] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [deleteTable, setDeleteTable] = useState<string | null>(null);
  const [pingDismissed, setPingDismissed] = useState(false);
  const navigate = useNavigate();
  const { bricked, refresh: refreshBrickStatus } = useBrickStatus();
  const { prefs: tablePrefs, setPref: setTablePref } = useTablePrefs(bricked);

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

      if (e.key === "e" && e.metaKey && !e.shiftKey && !e.altKey) {
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setEditMode((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, navigate]);

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          "border-r bg-card flex flex-col shrink-0 transition-[width] duration-200",
          collapsed ? "w-14" : "w-64",
        )}
      >
        {!collapsed && (
          <div className="border-b h-10 shrink-0">
            <DropdownMenu onOpenChange={(open) => { if (open && showPing) setPingDismissed(true); }}>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center justify-between w-full h-full cursor-pointer px-3 focus:outline-none"
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
            {tables.map((table) => {
              const pref = tablePrefs[table] || {};
              const color = pref.color || "none";
              const iconType = pref.icon || "table";
              const IconComponent = iconType === "people" ? Users : iconType === "grid" ? LayoutGrid : iconType === "list" ? List : Table2;

              const colorClasses = {
                none: { active: "ring-primary text-primary", inactive: "text-muted-foreground" },
                orange: { active: "ring-orange-400 text-orange-400", inactive: "text-orange-400" },
                purple: { active: "ring-purple-400 text-purple-400", inactive: "text-purple-400" },
                cyan: { active: "ring-cyan-400 text-cyan-400", inactive: "text-cyan-400" },
              }[color];

              const hasContextMenu = bricked || editMode;

              const navLink = (
                <NavLink
                  to={`/table/${table}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? cn("ring-1", colorClasses.active)
                        : cn("hover:ring-1 hover:ring-ring", colorClasses.inactive),
                      collapsed && "justify-center px-0",
                    )
                  }
                >
                  <IconComponent
                    className="h-4 w-4 shrink-0"
                    onClick={
                      hasContextMenu && !collapsed
                        ? (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.currentTarget as Element)
                              .closest("[data-ctx]")
                              ?.dispatchEvent(
                                new MouseEvent("contextmenu", {
                                  bubbles: true,
                                  cancelable: true,
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                }),
                              );
                          }
                        : undefined
                    }
                  />
                  {!collapsed && table}
                </NavLink>
              );

              if (!hasContextMenu) {
                return (
                  <Tooltip key={table} open={collapsed ? undefined : false}>
                    <TooltipTrigger asChild>
                      <div data-ctx>{navLink}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{table}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <ContextMenu key={table}>
                  <Tooltip open={collapsed ? undefined : false}>
                    <ContextMenuTrigger asChild>
                      <TooltipTrigger asChild>
                        <div data-ctx>{navLink}</div>
                      </TooltipTrigger>
                    </ContextMenuTrigger>
                    <TooltipContent side="right">{table}</TooltipContent>
                  </Tooltip>
                  <ContextMenuContent className="px-2 py-1.5 min-w-0">
                    {bricked && (
                      <>
                        <ContextMenuLabel className="px-0 py-0 pb-1 text-xs text-center">
                          Tag
                        </ContextMenuLabel>
                        <div className="flex gap-2 justify-center pb-1.5">
                          {(["none", "orange", "purple", "cyan"] as const).map((c) => (
                            <button
                              key={c}
                              className={cn(
                                "h-7 w-7 flex items-center justify-center cursor-pointer transition-opacity",
                                color === c ? "" : "opacity-40 hover:opacity-100",
                              )}
                              onClick={() =>
                                setTablePref(table, { color: c as TableColor })
                              }
                            >
                              {c === "none" ? (
                                <Ban className={cn(
                                  "h-3.5 w-3.5 text-muted-foreground",
                                  color === c && "ring-2 ring-ring rounded-full",
                                )} />
                              ) : (
                                <span
                                  className={cn(
                                    "h-3.5 w-3.5 rounded-full",
                                    c === "orange" && "bg-orange-400",
                                    c === "purple" && "bg-purple-400",
                                    c === "cyan" && "bg-cyan-400",
                                    color === c &&
                                      "ring-2 ring-offset-2 ring-offset-popover ring-ring",
                                  )}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                        <ContextMenuSeparator className="mx-0" />
                        <ContextMenuLabel className="px-0 py-0 pt-1.5 pb-1 text-xs text-center">
                          Icon
                        </ContextMenuLabel>
                        <div className="flex gap-2 justify-center">
                          {([
                            { value: "table", Icon: Table2 },
                            { value: "grid", Icon: LayoutGrid },
                            { value: "list", Icon: List },
                            { value: "people", Icon: Users },
                          ] as const).map(({ value, Icon }) => (
                            <button
                              key={value}
                              className={cn(
                                "h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-all",
                                iconType === value
                                  ? cn(
                                      "bg-muted",
                                      color === "orange"
                                        ? "text-orange-400"
                                        : color === "purple"
                                          ? "text-purple-400"
                                          : color === "cyan"
                                            ? "text-cyan-400"
                                            : "text-foreground",
                                    )
                                  : "text-muted-foreground/40 hover:text-muted-foreground",
                              )}
                              onClick={() =>
                                setTablePref(table, { icon: value as TableIcon })
                              }
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {editMode && (
                      <>
                        {bricked && <ContextMenuSeparator className="mx-0" />}
                        <ContextMenuItem
                          className="text-destructive focus:text-destructive gap-2"
                          onClick={() => setDeleteTable(table)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete table
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </TooltipProvider>
          {editMode && (
            <>
              <div className="border-t border-dashed border-muted-foreground/30 -mx-2 my-3" />
              <button
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full cursor-pointer text-muted-foreground hover:text-foreground hover:ring-1 hover:ring-ring",
                  collapsed && "justify-center px-0",
                )}
                onClick={() => setShowCreateTable(true)}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && "New table"}
              </button>
            </>
          )}
        </nav>
        <div className="border-t p-2 space-y-1">
          <button
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
              editMode
                ? "text-primary"
                : "text-muted-foreground opacity-60 hover:opacity-100",
              collapsed && "justify-center px-0",
            )}
            onClick={() => setEditMode((m) => !m)}
            title={editMode ? "Editing (⌘E)" : "Read-only (⌘E)"}
          >
            {editMode ? (
              <Pencil className="h-4 w-4 shrink-0" />
            ) : (
              <Lock className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (editMode ? "Editing" : "Read-only")}
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground opacity-60 hover:opacity-100",
                collapsed && "justify-center px-0",
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && "Settings"}
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <Outlet
          context={{ collapsed, setCollapsed, bricked, refreshBrickStatus, editMode, setEditMode, tables, refreshTables: loadDb }}
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

      {showCreateTable && (
        <CreateTableDialog
          onClose={() => setShowCreateTable(false)}
          onCreated={(name) => {
            setShowCreateTable(false);
            loadDb();
            navigate(`/table/${name}`);
          }}
        />
      )}

      {deleteTable && (
        <DeleteTableDialog
          tableName={deleteTable}
          onClose={() => setDeleteTable(null)}
          onDeleted={() => {
            setDeleteTable(null);
            loadDb();
            navigate("/");
          }}
        />
      )}
    </div>
  );
}
