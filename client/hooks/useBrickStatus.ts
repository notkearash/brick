import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useBrickStatus() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["brick-status"],
    queryFn: () =>
      fetch("/api/brick/status")
        .then((r) => r.json())
        .then((d) => d.bricked as boolean)
        .catch(() => null),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["brick-status"] });

  return { bricked: data ?? null, refresh };
}
