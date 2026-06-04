"use client";

import { useEffect, useState } from "react";

// Returns `value` after it has stopped changing for `delay` ms. Used to keep
// the live search/filter from firing a request on every keystroke.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
