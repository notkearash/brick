import type { FilterCondition } from "@shared/filters";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  ListFilter,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FilterRow } from "./FilterBuilder";

interface SchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface EditingCell {
  rowIndex: number;
  columnId: string;
  value: string;
  pkValue: unknown;
  rect: { top: number; left: number; width: number };
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: FilterCondition[];
  onFiltersChange?: React.Dispatch<React.SetStateAction<FilterCondition[]>>;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  totalRows?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
  onRefresh?: () => void;
  tableName?: string;
  pkColumn?: string;
  schema?: SchemaColumn[];
  editMode?: boolean;
  onDeleteRows?: (rows: TData[]) => Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filters,
  onFiltersChange,
  sidebarCollapsed,
  onToggleSidebar,
  totalRows,
  pagination,
  onPaginationChange,
  pageCount,
  onRefresh,
  tableName,
  pkColumn,
  schema,
  editMode = false,
  onDeleteRows,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const columnsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectColumn: ColumnDef<TData, TValue> = {
    id: "_select",
    header: ({ table: t }) => {
      const checked = t.getIsAllPageRowsSelected();
      const indeterminate = t.getIsSomePageRowsSelected();
      return (
        <button
          type="button"
          className={cn(
            "h-3.5 w-3.5 border flex items-center justify-center cursor-pointer",
            checked || indeterminate
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40",
          )}
          onClick={t.getToggleAllPageRowsSelectedHandler()}
        >
          {checked ? (
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          ) : indeterminate ? (
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2.5 5h5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          ) : null}
        </button>
      );
    },
    cell: ({ row }) => {
      const checked = row.getIsSelected();
      return (
        <button
          type="button"
          className={cn(
            "h-3.5 w-3.5 border flex items-center justify-center cursor-pointer",
            checked
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40",
          )}
          onClick={row.getToggleSelectedHandler()}
        >
          {checked && (
            <svg
              aria-hidden="true"
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          )}
        </button>
      );
    },
    enableSorting: false,
    enableHiding: false,
  };

  const allColumns =
    editMode && onDeleteRows ? [selectColumn, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: !!pagination,
    ...(pagination ? { pageCount, onPaginationChange } : {}),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: editMode,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      ...(pagination ? { pagination } : {}),
    },
  });

  useEffect(() => {
    if (!editMode) setRowSelection({});
  }, [editMode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (!el) return;
      e.preventDefault();
      el.scrollLeft += e.deltaX;
      el.scrollTop += e.deltaY;
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        columnsRef.current &&
        !columnsRef.current.contains(e.target as Node)
      ) {
        setColumnsOpen(false);
      }
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setEditingCell(null);
        setEditError("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "r" && e.metaKey) {
        e.preventDefault();
        onRefresh?.();
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "[" && table.getCanPreviousPage()) {
        table.previousPage();
      } else if (e.key === "]" && table.getCanNextPage()) {
        table.nextPage();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [table, onRefresh]);

  const canEdit = !!(tableName && pkColumn);

  const handleCellClick = useCallback(
    (
      e: React.MouseEvent<HTMLTableCellElement>,
      rowIndex: number,
      columnId: string,
      row: Record<string, unknown>,
    ) => {
      if (!editMode || !canEdit || !pkColumn || columnId === pkColumn) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cellValue = row[columnId];
      setEditValue(cellValue === null ? "" : String(cellValue));
      setEditError("");
      setEditingCell({
        rowIndex,
        columnId,
        value: cellValue === null ? "" : String(cellValue),
        pkValue: row[pkColumn],
        rect: {
          top: rect.bottom,
          left: rect.left,
          width: Math.max(rect.width, 240),
        },
      });
    },
    [editMode, canEdit, pkColumn],
  );

  const handleSave = useCallback(
    async (valueToSave: string | null) => {
      if (!editingCell || !tableName || !pkColumn) return;
      setSaving(true);
      setEditError("");
      try {
        const res = await fetch(
          `/api/tables/${tableName}/${editingCell.pkValue}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [editingCell.columnId]: valueToSave }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Save failed" }));
          setEditError(err.error || "Save failed");
          return;
        }
        setEditingCell(null);
        setEditError("");
        onRefresh?.();
      } catch {
        setEditError("Network error");
      } finally {
        setSaving(false);
      }
    },
    [editingCell, tableName, pkColumn, onRefresh],
  );

  const hasActiveFilter = (filters?.length ?? 0) > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-2 h-10 shrink-0">
        <div className="flex items-center gap-0.5">
          {onToggleSidebar && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleSidebar}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}

          {onFiltersChange && schema && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5"
                onClick={() =>
                  onFiltersChange((prev) => [
                    ...prev,
                    { column: schema[0]?.name || "", op: "=", value: "" },
                  ])
                }
              >
                <ListFilter className="h-3.5 w-3.5" />
                Add filter
              </Button>
              {hasActiveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => onFiltersChange([])}
                >
                  Clear ({filters?.length ?? 0})
                </Button>
              )}
            </>
          )}

          <div className="relative" ref={columnsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              onClick={() => setColumnsOpen(!columnsOpen)}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {columnsOpen && (
              <div className="absolute top-full left-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-md p-1 z-50 min-w-40 max-h-75 overflow-auto">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:outline hover:outline-dashed hover:outline-amber-500 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="accent-primary"
                      />
                      {column.id}
                    </label>
                  ))}
              </div>
            )}
          </div>

          {editMode && tableName && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1.5"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/tables/${tableName}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: "{}",
                    });
                    if (res.ok) onRefresh?.();
                  } catch {
                    toast.error("Failed to add row");
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </Button>
              {onDeleteRows && Object.keys(rowSelection).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5 text-destructive hover:text-destructive"
                  disabled={deleting}
                  onClick={async () => {
                    const selected = table
                      .getSelectedRowModel()
                      .rows.map((r) => r.original);
                    setDeleting(true);
                    try {
                      await onDeleteRows(selected);
                      setRowSelection({});
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting
                    ? "Deleting..."
                    : `Delete (${Object.keys(rowSelection).length})`}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-muted-foreground mr-1">
            {totalRows ?? data.length} rows
          </span>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              const s = Number(e.target.value);
              table.setPageSize(s);
              table.setPageIndex(0);
              localStorage.setItem("brick-page-size", String(s));
              e.target.blur();
            }}
            className="h-7 bg-transparent text-xs font-mono tabular-nums text-muted-foreground border rounded px-1 cursor-pointer"
          >
            {[25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {onRefresh && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {hasActiveFilter &&
        onFiltersChange &&
        schema &&
        (filters ?? []).map((filter, i) => (
          <FilterRow
            // biome-ignore lint/suspicious/noArrayIndexKey: filters have no stable id
            key={i}
            filter={filter}
            schema={schema}
            onChange={(patch) =>
              onFiltersChange((prev) =>
                prev.map((f, j) => (j === i ? { ...f, ...patch } : f)),
              )
            }
            onRemove={() =>
              onFiltersChange((prev) => prev.filter((_, j) => j !== i))
            }
          />
        ))}

      <div ref={scrollRef} className="flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isEditable =
                      editMode &&
                      canEdit &&
                      cell.column.id !== pkColumn &&
                      cell.column.id !== "_select";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "select-text",
                          isEditable &&
                            "cursor-pointer hover:outline hover:outline-dashed hover:outline-amber-500",
                        )}
                        onClick={
                          isEditable
                            ? (e) =>
                                handleCellClick(
                                  e,
                                  row.index,
                                  cell.column.id,
                                  row.original as Record<string, unknown>,
                                )
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingCell && (
        <div
          ref={editorRef}
          className="fixed bg-popover text-popover-foreground border rounded-md shadow-lg z-50 p-3"
          style={{
            top: editingCell.rect.top + 4,
            left: editingCell.rect.left,
            width: editingCell.rect.width,
            minWidth: 240,
          }}
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {editingCell.columnId}
          </div>
          <textarea
            className="w-full min-h-15 bg-background border rounded px-2 py-1.5 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                handleSave(editValue);
              } else if (e.key === "Escape") {
                setEditingCell(null);
                setEditError("");
              }
            }}
            // biome-ignore lint/a11y/noAutofocus: intentional focus on cell editor
            autoFocus
          />
          {editError && (
            <p className="text-xs text-destructive mt-1">{editError}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleSave(editValue)}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
              {!saving && (
                <span className="ml-1 text-[10px] opacity-60">⌘↵</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setEditingCell(null);
                setEditError("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground ml-auto"
              onClick={() => handleSave(null)}
              disabled={saving}
            >
              Set NULL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
