import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, qs } from "lib/api.js";
import Pagination from "components/ui/Pagination.jsx";
import CourseCard from "pages/corper/CourseCard.jsx";
import "styles/corper.css";

const FILTER_KEYS = ["q", "category", "courseType", "state", "lga", "page"];

export default function Courses({ fixedType = "" }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""])));

  const query = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ""]));
  const key = JSON.stringify(query);

  const load = useCallback(() => {
    setLoading(true);
    api(`/courses/${qs({ ...query, courseType: fixedType || query.courseType })}`)
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fixedType]);

  useEffect(() => { load(); }, [load]);

  function apply(e) {
    e?.preventDefault();
    setParams(Object.fromEntries(Object.entries({ ...draft, page: "" }).filter(([, v]) => v)));
  }
  function reset() {
    setDraft(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));
    setParams({});
  }
  function goPage(p) {
    setParams(Object.fromEntries(Object.entries({ ...query, page: String(p) }).filter(([, v]) => v)));
  }
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="cp-page">
      <div className="cp-head">
        <h2>Courses</h2>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Newest first · every course is open to enrol in</span>
      </div>

      <form className="panel cp-filters" style={{ padding: 14 }} onSubmit={apply} aria-label="Filter courses">
        <label>Search<input value={draft.q} onChange={set("q")} placeholder="Course, trainer or place" /></label>
        <label>Skill
          <select value={draft.category} onChange={set("category")}>
            <option value="">All skills</option>
            {(data?.categories || []).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        {!fixedType && (
          <label>Type
            <select value={draft.courseType} onChange={set("courseType")}>
              <option value="">In-Camp & Post-Camp</option>
              <option value="in_camp">In-Camp</option>
              <option value="post_camp">Post-Camp</option>
            </select>
          </label>
        )}
        <label>State<input value={draft.state} onChange={set("state")} placeholder="e.g. Lagos" /></label>
        <label>LGA<input value={draft.lga} onChange={set("lga")} placeholder="e.g. Ikeja" /></label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary-button" type="submit">Apply</button>
          <button className="ghost-button" type="button" onClick={reset}>Clear</button>
        </div>
      </form>

      {error && <div className="inline-message inline-message--error" role="alert">{error}</div>}
      {loading && !data && <div className="empty-state">Loading courses…</div>}
      {data && data.courses.length === 0 && (
        <div className="empty-state"><h3>No courses found</h3><p>Try clearing your filters.</p></div>
      )}
      {data && data.courses.length > 0 && (
        <div className="cp-grid" aria-busy={loading}>
          {data.courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={goPage} />
      <p style={{ fontSize: 12, color: "var(--muted)" }}>Looking for a person instead? <Link to="/app/trainers">Browse trainers</Link>.</p>
    </div>
  );
}
