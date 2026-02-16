import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router";
import { BrickUpDialog } from "@/components/dialogs/BrickUpDialog";
import { CreateTableDialog } from "@/components/dialogs/CreateTableDialog";
import { DeleteTableDialog } from "@/components/dialogs/DeleteTableDialog";
import {
  SidebarFooter,
  SidebarHeader,
  SortableNavItem,
} from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBrickStatus } from "@/hooks/useBrickStatus";
import { useDatabase } from "@/hooks/useDatabase";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getViewRoute, useTablePrefs } from "@/hooks/useTablePrefs";
import { cn } from "@/lib/utils";

export interface LayoutContext {
  collapsed: boolean;
  setCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  bricked: boolean | null;
  refreshBrickStatus: () => void;
  editMode: boolean;
  setEditMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  tables: string[];
  refreshTables: () => void;
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showBrickDialog, setShowBrickDialog] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [deleteTable, setDeleteTable] = useState<string | null>(null);
  const [pingDismissed, setPingDismissed] = useState(false);

  const { tables, dbPath, loadDb, navigate } = useDatabase();
  const { bricked, refresh: refreshBrickStatus } = useBrickStatus();
  const {
    prefs: tablePrefs,
    setPref: setTablePref,
    tableOrder,
    setTableOrder,
    refresh: refreshPrefs,
  } = useTablePrefs(bricked);

  const sortedTables = useMemo(() => {
    if (tableOrder.length === 0) return tables;
    const orderMap = new Map(tableOrder.map((t, i) => [t, i]));
    return [...tables].sort((a, b) => {
      const ai = orderMap.get(a) ?? Infinity;
      const bi = orderMap.get(b) ?? Infinity;
      return ai - bi;
    });
  }, [tables, tableOrder]);

  useKeyboardShortcuts({
    tables: sortedTables,
    navigate,
    setCollapsed,
    setEditMode,
    tablePrefs,
  });

  useEffect(() => {
    const handler = () => {
      loadDb();
      refreshPrefs();
    };
    window.addEventListener("brick:refresh-tables", handler);
    return () => window.removeEventListener("brick:refresh-tables", handler);
  }, [loadDb, refreshPrefs]);

  const canReorder = editMode && bricked === true;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sortedTables.indexOf(active.id as string);
      const newIndex = sortedTables.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      setTableOrder(arrayMove(sortedTables, oldIndex, newIndex));
    },
    [sortedTables, setTableOrder],
  );

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTables}
              strategy={verticalListSortingStrategy}
            >
              <TooltipProvider delayDuration={300}>
                {sortedTables.map((table) => (
                  <SortableNavItem
                    key={table}
                    table={table}
                    collapsed={collapsed}
                    bricked={bricked}
                    editMode={editMode}
                    canReorder={canReorder}
                    viewType={tablePrefs[table]?.viewType}
                    pref={tablePrefs[table] || {}}
                    onSetPref={(update) => setTablePref(table, update)}
                    onDeleteTable={() => setDeleteTable(table)}
                  />
                ))}
              </TooltipProvider>
            </SortableContext>
          </DndContext>
          {editMode && (
            <>
              <div className="border-t border-dashed border-muted-foreground/30 -mx-2 my-3" />
              <button
                type="button"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all w-full cursor-pointer text-muted-foreground hover:text-foreground hover:shadow-[inset_0_2px_8px_rgba(57,57,62,0.5),inset_0_-1px_5px_rgba(57,57,62,0.25)] hover:bg-muted hover:rounded-[10px]",
                  collapsed && "justify-center px-0",
                )}
                onClick={() => setShowCreateTable(true)}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && "New item"}
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
          bricked={bricked}
          onClose={() => setShowCreateTable(false)}
          onCreated={(name, viewType) => {
            setShowCreateTable(false);
            loadDb();
            refreshPrefs();
            navigate(`${getViewRoute(viewType)}/${name}`);
          }}
        />
      )}

      {deleteTable && (
        <DeleteTableDialog
          tableName={deleteTable}
          displayName={tablePrefs?.[deleteTable]?.displayName}
          skipConfirm={tablePrefs?.[deleteTable]?.viewType === "document"}
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
