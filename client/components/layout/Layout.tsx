import { useState } from "react";
import { Outlet } from "react-router";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrickStatus } from "@/hooks/useBrickStatus";
import { useDatabase } from "@/hooks/useDatabase";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTablePrefs } from "@/hooks/useTablePrefs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrickUpDialog } from "@/components/dialogs/BrickUpDialog";
import { CreateTableDialog } from "@/components/dialogs/CreateTableDialog";
import { DeleteTableDialog } from "@/components/dialogs/DeleteTableDialog";
import {
  SidebarHeader,
  SidebarFooter,
  NavItem,
} from "@/components/sidebar";

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showBrickDialog, setShowBrickDialog] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [deleteTable, setDeleteTable] = useState<string | null>(null);
  const [pingDismissed, setPingDismissed] = useState(false);

  const { tables, dbPath, loadDb, navigate } = useDatabase();
  const { bricked, refresh: refreshBrickStatus } = useBrickStatus();
  const { prefs: tablePrefs, setPref: setTablePref } = useTablePrefs(bricked);

  useKeyboardShortcuts({ tables, navigate, setCollapsed, setEditMode });

  const showPing = bricked === false && !pingDismissed;

  return (
    <div className="flex h-screen">
      <aside
        className={cn(
          "border-r bg-card flex flex-col shrink-0 transition-[width] duration-200",
          collapsed ? "w-14" : "w-64",
        )}
      >
        {!collapsed && (
          <SidebarHeader
            dbPath={dbPath}
            bricked={bricked}
            showPing={showPing}
            onPingDismiss={() => setPingDismissed(true)}
            onShowBrickDialog={() => setShowBrickDialog(true)}
            onChangeDb={() => navigate("/setup")}
          />
        )}

        <nav className="flex-1 overflow-auto p-2 space-y-1">
          <TooltipProvider delayDuration={300}>
            {tables.map((table) => (
              <NavItem
                key={table}
                table={table}
                collapsed={collapsed}
                bricked={bricked}
                editMode={editMode}
                pref={tablePrefs[table] || {}}
                onSetPref={(update) => setTablePref(table, update)}
                onDeleteTable={() => setDeleteTable(table)}
              />
            ))}
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

        <SidebarFooter
          collapsed={collapsed}
          editMode={editMode}
          onToggleEditMode={() => setEditMode((m) => !m)}
        />
      </aside>

      <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <Outlet
          context={{
            collapsed,
            setCollapsed,
            bricked,
            refreshBrickStatus,
            editMode,
            setEditMode,
            tables,
            refreshTables: loadDb,
          }}
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
