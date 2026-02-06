import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";

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
  const [schema, setSchema] = useState<SchemaColumn[]>([]);
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tableName) return;

    setLoading(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        {error}
      </div>
    );
  }

  if (!data || !schema.length) {
    return <div className="flex items-center justify-center h-64">No data</div>;
  }

  const columns: ColumnDef<Record<string, unknown>>[] = schema.map((col) => ({
    accessorKey: col.name,
    header: col.name,
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null)
        return <span className="text-muted-foreground">NULL</span>;
      if (typeof value === "boolean") return value ? "true" : "false";
      if (typeof value === "object") return JSON.stringify(value);
      const str = String(value);
      if (str.length > 100) return str.slice(0, 100) + "...";
      return str;
    },
  }));

  const searchCol = schema.find(
    (col) =>
      col.name !== "id" &&
      (col.type.includes("TEXT") || col.type.includes("VARCHAR")),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tableName}</h1>
          <p className="text-sm text-muted-foreground">{data.total} rows</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data.rows}
        searchKey={searchCol?.name}
        searchPlaceholder={
          searchCol ? `Search by ${searchCol.name}...` : undefined
        }
      />
    </div>
  );
}
