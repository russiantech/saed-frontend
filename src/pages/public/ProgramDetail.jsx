import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import FloatingNav from "../../components/layout/FloatingNav.jsx";
import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/programs/")
      .then((d) => {
        const found = (d.programs || []).find((p) => String(p.id) === String(id));
        if (found) setCourse(found); else setError("This course is not available.");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const target = `/app/courses/${id}`;
  const open = () => (isAuthenticated ? navigate(target) : navigate("/login", { state: { redirectTo: target } }));

  return (
    <div className="site-page">
      <FloatingNav />
      <Link className="back-link" to="/programs">← All courses</Link>
      <section className="panel full-panel" style={{ padding: 24, display: "grid", gap: 12 }}>
        {error && <div className="inline-message inline-message--error">{error}</div>}
        {!course && !error && <div className="empty-state">Loading…</div>}
        {course && (
          <>
            <span className="category-label">{course.categoryLabel}</span>
            <h1 style={{ margin: 0 }}>{course.title}</h1>
            <p style={{ margin: 0 }}>By {course.trainerName}{course.trainingLocation ? ` · ${course.trainingLocation}` : ""}</p>
            <p>{course.description}</p>
            {course.learningObjectives?.length > 0 && (<><h3>What you’ll learn</h3><ul>{course.learningObjectives.map((o) => <li key={o}>{o}</li>)}</ul></>)}
            <p style={{ color: "var(--muted)" }}>
              {course.lessonCount} lessons · {course.freeLessonCount} free{course.paidLessonCount ? ` · ${course.paidLessonCount} premium (unlock individually)` : ""} · {course.availableSlots} slots left
            </p>
            <div><button className="primary-button" type="button" onClick={open}>{isAuthenticated ? "Open course" : "Sign in to enrol"}</button></div>
          </>
        )}
      </section>
    </div>
  );
}
