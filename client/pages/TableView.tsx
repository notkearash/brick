import type { FilterCondition } from "@shared/filters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router";
import { DataTable } from "@/components/data-table/DataTable";
import { ColumnOptionsDialog } from "@/components/dialogs/ColumnOptionsDialog";
import type { LayoutContext } from "@/components/layout/Layout";
import { COLOR_CLASSES, useColumnOptions } from "@/hooks/useColumnOptions";

function CellContent({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null)
    return <span className="text-muted-foreground">NULL</span>;
  if (typeof value === "boolean") return <>{value ? "true" : "false"}</>;

  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  const isLong = str.length > 60;

  if (!isLong) return <span className="whitespace-nowrap font-mono">{str}</span>;

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      className={
        expanded
          ? "text-left whitespace-pre-wrap wrap-break-words max-w-md font-mono"
          : "text-left truncate block max-w-50 cursor-pointer hover:text-foreground/80 font-mono"
      }
      title={expanded ? "Click to collapse" : "Click to expand"}
    >
      {expanded ? str : `${str.slice(0, 60)}…`}
    </button>
  );
}

interface SchemaColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface TableData {
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}

export function TableView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed, editMode, bricked } =
    useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Number(localStorage.getItem("brick-page-size")) || 50,
  });
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const { columnOptions, setColumnOptions } = useColumnOptions(tableName, bricked);
  const [configuringColumn, setConfiguringColumn] = useState<string | null>(null);

  useEffect(() => {
    if (tableName) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      setFilters([]);
    }
  }, [tableName]);

  useEffect(() => {
    if (filters) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [filters]);

  const { data: schemaResult } = useQuery({
    queryKey: ["table-schema", tableName],
    queryFn: async () => {
      const res = await fetch(`/api/tables/${tableName}/schema`).then((r) =>
        r.json(),
      );
      if (res.error) throw new Error(res.error);
      return res.columns as SchemaColumn[];
    },
    enabled: !!tableName,
  });

  const {
    data: tableResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "table",
      tableName,
      pagination.pageIndex,
      pagination.pageSize,
      JSON.stringify(filters),
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });
      if (filters.length > 0) {
        params.set("filters", JSON.stringify(filters));
      }
      return fetch(`/api/tables/${tableName}?${params}`).then((r) =>
        r.json(),
      ) as Promise<TableData>;
    },
    enabled: !!tableName,
    placeholderData: (prev) => prev,
  });

  const schema = schemaResult ?? [];
  const data = tableResult ?? null;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["table", tableName] });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        {error.message}
      </div>
    );
  }

  if (!data || !schema.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data
      </div>
    );
  }

  const columns: ColumnDef<Record<string, unknown>>[] = schema.map((col) => ({
    accessorKey: col.name,
    header: col.name,
    cell: ({ getValue }) => {
      const v = getValue();
      const opts = columnOptions[col.name];
      const match = opts?.find((o) => o.value === v);
      if (match) {
        return (
          <span
            className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${COLOR_CLASSES[match.color].badge}`}
          >
            {match.value}
          </span>
        );
      }
      return <CellContent value={v} />;
    },
  }));

  const pkColumn = schema.find((col) => col.pk === 1)?.name;

  return (
    <>
      <DataTable
      columns={columns}
      data={data.rows}
      filters={filters}
      onFiltersChange={setFilters}
      sidebarCollapsed={collapsed}
      onToggleSidebar={() => setCollapsed((c: boolean) => !c)}
      totalRows={data.total}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={Math.ceil(data.total / pagination.pageSize)}
      onRefresh={invalidate}
      tableName={tableName}
      pkColumn={pkColumn}
      schema={schema}
      editMode={editMode}
      columnOptions={columnOptions}
      onConfigureColumnOptions={setConfiguringColumn}
      onDeleteRows={
        pkColumn
          ? async (rows) => {
              const ids = rows.map(
                (r) => (r as Record<string, unknown>)[pkColumn],
              );
              await Promise.all(
                ids.map((id) =>
                  fetch(`/api/tables/${tableName}/${id}`, { method: "DELETE" }),
                ),
              );
              invalidate();
            }
          : undefined
      }
      />
      {configuringColumn && (
        <ColumnOptionsDialog
        column={configuringColumn}
        currentOptions={columnOptions[configuringColumn] ?? []}
        onSave={setColumnOptions}
          onClose={() => setConfiguringColumn(null)}
        />
      )}
    </>
  );
}
