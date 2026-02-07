import { useState, useRef, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PanelLeftClose,
  PanelLeftOpen,
  ListFilter,
  Columns3,
  Lock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  totalRows?: number;
  onRefresh?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  sidebarCollapsed,
  onToggleSidebar,
  totalRows,
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: { pageSize: 50 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (
        columnsRef.current &&
        !columnsRef.current.contains(e.target as Node)
      ) {
        setColumnsOpen(false);
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
  }, [table]);

  const filterValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
    : "";
  const hasActiveFilter = filterValue.length > 0;

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

          {searchKey && (
            <div className="relative" ref={filterRef}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs gap-1.5",
                  hasActiveFilter && "text-primary",
                )}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <ListFilter className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilter && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
              {filterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-md p-2 z-50 min-w-[240px]">
                  <Input
                    placeholder={searchPlaceholder}
                    value={filterValue}
                    onChange={(e) =>
                      table.getColumn(searchKey)?.setFilterValue(e.target.value)
                    }
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>
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
              <div className="absolute top-full left-0 mt-1 bg-popover text-popover-foreground border rounded-md shadow-md p-1 z-50 min-w-[160px] max-h-[300px] overflow-auto">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-accent rounded"
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

          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs gap-1 ml-1 !cursor-not-allowed" disabled>
            <Lock className="h-3 w-3" />
            Read-only
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">
            {totalRows ?? table.getFilteredRowModel().rows.length} rows
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
            onChange={(e) => { table.setPageSize(Number(e.target.value)); e.target.blur(); }}
            className="h-7 bg-transparent text-xs tabular-nums text-muted-foreground border rounded px-1 cursor-pointer"
          >
            {[25, 50, 100, 250].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-xs tabular-nums text-muted-foreground">
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

      <div className="flex-1 overflow-auto min-h-0">
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
