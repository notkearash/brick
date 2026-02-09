import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

export function useDatabase() {
  const [tables, setTables] = useState<string[]>([]);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadDb = useCallback(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((config) => {
        if (!config.dbPath) {
          navigate("/setup");
          return;
        }
        setDbPath(config.dbPath);
        return fetch("/api/tables");
      })
      .then((r) => r?.json())
      .then((tableList) => {
        if (tableList && !tableList.error) {
          setTables(tableList);
        }
      });
  }, [navigate]);

  useEffect(() => {
    loadDb();
  }, [loadDb]);

  return { tables, dbPath, loadDb, navigate };
}
