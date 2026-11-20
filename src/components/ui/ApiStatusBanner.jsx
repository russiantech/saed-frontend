import { useEffect, useState } from "react";

import { API_BASE_URL } from "lib/config.js";
import { API_PROBLEM_TEXT, checkApi } from "lib/apiHealth.js";

/** Slim banner shown only when the API cannot be reached; tells operators exactly what to fix. */
export default function ApiStatusBanner() {
  const [problem, setProblem] = useState(null);
  useEffect(() => {
    let live = true;
    checkApi().then((r) => {
      if (!live || r.ok) return;
      setProblem(r);
      console.error(`[SAED] API check failed (${r.reason}) for ${API_BASE_URL}. Set API_URL in /config.js (or VITE_API_URL at build time) to the full API address, e.g. https://api.example.com/api`);
    });
    return () => { live = false; };
  }, []);
  if (!problem) return null;
  return (
    <div className="inline-message inline-message--error" role="alert" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
      {API_PROBLEM_TEXT[problem.reason]} <small>(API address: {API_BASE_URL})</small>
    </div>
  );
}
