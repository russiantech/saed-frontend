import { useCallback, useEffect, useState } from "react";
import { api } from "lib/api.js";

/** Admin: the list of streams (newest first) for filters and forms. */
export default function useStreams() {
  const [streams, setStreams] = useState(null);
  const [years, setYears] = useState([]);
  const reload = useCallback(async () => {
    try {
      const d = await api("/manage/streams/");
      setStreams(d.streams || []);
      setYears(d.years || []);
    } catch {
      setStreams([]);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { streams, years, reload };
}
