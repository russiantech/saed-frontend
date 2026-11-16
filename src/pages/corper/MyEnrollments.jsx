import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, qs } from "lib/api.js";
import Pagination from "components/ui/Pagination.jsx";
import { typeLabel } from "pages/corper/CourseCard.jsx";
import "styles/corper.css";

export default function MyEnrollments() {
  const [params, setParams] = useSearchParams();
  const page = params.get("page") || "1";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let off = false;
    api(`/my-courses/${qs({ page })}`).then((d) => !off && setData(d)).catch((e) => !off && setError(e.message));
    return () => { off = true; };
  }, [page]);

  return (
    <div className="cp-page">
      <div className="cp-head"><h2>My Enrollments</h2><Link className="ghost-button" to="/app/courses">Find more courses</Link></div>
      {error && <div className="inline-message inline-message--error" role="alert">{error}</div>}
      {!data && !error && <div className="empty-state">Loading…</div>}
      {data && data.courses.length === 0 && (
        <div className="empty-state"><h3>You haven’t enrolled yet</h3><p>Enrolling is one tap and connects you to the trainer.</p>
          <Link className="primary-button" to="/app/courses">Browse courses</Link></div>
      )}
      {data && data.courses.length > 0 && (
        <div className="cp-grid">
          {data.courses.map((c) => {
            const p = c.progress || { percentage: 0, completedLessons: 0, totalLessons: 0 };
            return (
              <article className="cp-card" key={c.id}>
                <div className="cp-badges">
                  <span className="cp-badge">{typeLabel(c.courseType)}</span>
                  {c.enrollmentStatus !== "confirmed" && <span className="cp-badge cp-badge--warn">{c.enrollmentStatus}</span>}
                  {c.inCampBlocked && <span className="cp-badge cp-badge--warn">In-Camp access ended</span>}
                </div>
                <h3>{c.title}</h3>
                <p>{c.trainerName ? `By ${c.trainerName}` : ""}</p>
                <div className="cp-progress" role="progressbar" aria-valuenow={p.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span style={{ width: `${p.percentage}%` }} /></div>
                <p>{p.completedLessons} of {p.totalLessons} lessons · {p.percentage}%</p>
                <div className="cp-card-foot"><Link className="primary-button" to={`/app/courses/${c.id}`}>Open course</Link></div>
              </article>
            );
          })}
        </div>
      )}
      <Pagination pagination={data?.pagination} onPage={(p) => setParams({ page: String(p) })} />
    </div>
  );
}
