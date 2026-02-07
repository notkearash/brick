import { useCallback, useEffect, useState } from "react";

export function useBrickStatus() {
  const [bricked, setBricked] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/brick/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.bricked !== undefined) setBricked(data.bricked);
      })
      .catch(() => setBricked(null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bricked, refresh };
}
