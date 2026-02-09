import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useDatabase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => fetch("/api/config").then((r) => r.json()),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then((r) => r.json()),
    enabled: !!config?.dbPath,
  });

  useEffect(() => {
    if (config && !config.dbPath) {
      navigate("/setup");
    }
  }, [config, navigate]);

  const loadDb = () => {
    queryClient.invalidateQueries({ queryKey: ["config"] });
    queryClient.invalidateQueries({ queryKey: ["tables"] });
  };

  return { tables, dbPath: config?.dbPath ?? null, loadDb, navigate };
}
