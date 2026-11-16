import { useState, useCallback } from "react";

export default function useToggleArray(initial = []) {
  const [items, setItems] = useState(initial);

  const toggle = useCallback((item) => {
    setItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const set = useCallback((newItems) => setItems(newItems), []);

  return [items, toggle, set];
}



