import { useState } from "react";
import { useParams, useOutletContext } from "react-router";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  editMode: boolean;
}

export function TableView() {
  const { tableName } = useParams<{ tableName: string }>();
  const { collapsed, setCollapsed, editMode } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();

  const { data: tableResult, isLoading, error } = useQuery({
    queryKey: ["table", tableName],
    queryFn: async () => {
      const [schemaData, tableData] = await Promise.all([
        fetch(`/api/tables/${tableName}/schema`).then((r) => r.json()),
        fetch(`/api/tables/${tableName}`).then((r) => r.json()),
      ]);
      if (schemaData.error) throw new Error(schemaData.error);
      return { schema: schemaData.columns as SchemaColumn[], data: tableData as TableData };
    },
    enabled: !!tableName,
  });

  const schema = tableResult?.schema ?? [];
  const data = tableResult?.data ?? null;

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
