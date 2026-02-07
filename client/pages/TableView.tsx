import { useCallback, useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";

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
}

export function TableView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed } = useOutletContext<LayoutContext>();
  const [schema, setSchema] = useState<SchemaColumn[]>([]);
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback((showLoading = true) => {
    if (!tableName) return;

    if (showLoading) setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/tables/${tableName}/schema`).then((r) => r.json()),
      fetch(`/api/tables/${tableName}`).then((r) => r.json()),
    ])
      .then(([schemaData, tableData]) => {
        if (schemaData.error) {
          setError(schemaData.error);
          return;
        }
        setSchema(schemaData.columns);
        setData(tableData);
      })
      .catch(() => setError("Failed to load table"))
      .finally(() => setLoading(false));
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        {error}
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

  const searchCol = schema.find(
    (col) =>
      col.name !== "id" &&
      (col.type.includes("TEXT") || col.type.includes("VARCHAR")),
  );

  return (
    <DataTable
      columns={columns}
      data={data.rows}
      searchKey={searchCol?.name}
      searchPlaceholder={
        searchCol ? `Search by ${searchCol.name}...` : undefined
      }
      sidebarCollapsed={collapsed}
      onToggleSidebar={() => setCollapsed((c: boolean) => !c)}
      totalRows={data.total}
      onRefresh={() => fetchData(false)}
    />
  );
}
