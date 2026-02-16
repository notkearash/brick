import type { FilterCondition } from "@shared/filters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
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

  if (!isLong)
    return <span className="whitespace-nowrap font-mono">{str}</span>;

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

interface ForeignKey {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
}

interface SchemaResult {
  columns: SchemaColumn[];
  foreignKeys: ForeignKey[];
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
  const { columnOptions, setColumnOptions } = useColumnOptions(
    tableName,
    bricked,
  );
  const [configuringColumn, setConfiguringColumn] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (tableName) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      const params = new URLSearchParams(window.location.search);
      const f = params.get("filters");
      if (f) {
        try {
          setFilters(JSON.parse(f) as FilterCondition[]);
        } catch {
          setFilters([]);
        }
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        setFilters([]);
      }
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
      const res = (await fetch(`/api/tables/${tableName}/schema`).then((r) =>
        r.json(),
      )) as SchemaResult;
      if ((res as unknown as { error: string }).error)
        throw new Error((res as unknown as { error: string }).error);
      return res;
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

  const schema = schemaResult?.columns ?? [];
  const foreignKeys = schemaResult?.foreignKeys ?? [];
  const data = tableResult ?? null;

  const fkMap = useMemo(() => {
    const map: Record<string, ForeignKey> = {};
    for (const fk of foreignKeys) {
      map[fk.from] = fk;
    }
    return map;
  }, [foreignKeys]);

  const fkTables = useMemo(
    () => [...new Set(foreignKeys.map((fk) => fk.table))],
    [foreignKeys],
  );

  const { data: lookups } = useQuery({
    queryKey: ["fk-lookups", tableName, fkTables],
    queryFn: async () => {
      const results: Record<string, Record<string, string>> = {};
      await Promise.all(
        fkTables.map(async (t) => {
          const res = await fetch(`/api/tables/${t}/lookup`).then((r) =>
            r.json(),
          );
          if (res.lookup) results[t] = res.lookup;
        }),
      );
      return results;
    },
    enabled: fkTables.length > 0,
  });

  const navigate = useNavigate();

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
      const fk = fkMap[col.name];
      if (fk && v !== null && v !== undefined) {
        const displayValue = lookups?.[fk.table]?.[String(v)];
        return (
          <button
            type="button"
            className="inline-block px-1.5 py-0.5 text-xs rounded font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer transition-colors"
            onClick={() => {
              const filter: FilterCondition[] = [
                { column: fk.to, op: "=", value: String(v) },
              ];
              navigate(
                `/table/${fk.table}?filters=${encodeURIComponent(JSON.stringify(filter))}`,
              );
            }}
          >
            {displayValue ?? String(v)}
          </button>
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
                    fetch(`/api/tables/${tableName}/${id}`, {
                      method: "DELETE",
                    }),
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
