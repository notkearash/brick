import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table/DataTable";
import type { FilterCondition } from "@shared/filters";

function CellContent({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false);

  if (value === null)
    return <span className="text-muted-foreground">NULL</span>;
  if (typeof value === "boolean") return <>{value ? "true" : "false"}</>;

  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  const isLong = str.length > 60;

  if (!isLong) return <span className="whitespace-nowrap">{str}</span>;

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      className={
        expanded
          ? "text-left whitespace-pre-wrap break-words max-w-md"
          : "text-left truncate block max-w-[200px] cursor-pointer hover:text-foreground/80"
      }
      title={expanded ? "Click to collapse" : "Click to expand"}
    >
      {expanded ? str : str.slice(0, 60) + "…"}
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

interface LayoutContext {
  collapsed: boolean;
  setCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  editMode: boolean;
}

export function TableView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed, editMode } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Number(localStorage.getItem("brick-page-size")) || 50,
  });
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setFilters([]);
  }, [tableName]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [filters]);

  const { data: schemaResult } = useQuery({
    queryKey: ["table-schema", tableName],
    queryFn: async () => {
      const res = await fetch(`/api/tables/${tableName}/schema`).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      return res.columns as SchemaColumn[];
    },
    enabled: !!tableName,
  });

  const { data: tableResult, isLoading, error } = useQuery({
    queryKey: ["table", tableName, pagination.pageIndex, pagination.pageSize, JSON.stringify(filters)],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });
      if (filters.length > 0) {
        params.set("filters", JSON.stringify(filters));
      }
      return fetch(`/api/tables/${tableName}?${params}`).then((r) => r.json()) as Promise<TableData>;
    },
    enabled: !!tableName,
    placeholderData: (prev) => prev,
  });

  const schema = schemaResult ?? [];
  const data = tableResult ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["table", tableName] });

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
    cell: ({ getValue }) => <CellContent value={getValue()} />,
  }));

  const pkColumn = schema.find((col) => col.pk === 1)?.name;

  return (
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
      onDeleteRows={
        pkColumn
          ? async (rows) => {
              const ids = rows.map((r) => (r as Record<string, unknown>)[pkColumn!]);
              await Promise.all(
                ids.map((id) =>
                  fetch(`/api/tables/${tableName}/${id}`, { method: "DELETE" })
                )
              );
              invalidate();
            }
          : undefined
      }
    />
  );
}
