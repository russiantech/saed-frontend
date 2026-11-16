import { Link } from "react-router-dom";
import "styles/corper.css";

export const typeLabel = (t) => (t === "in_camp" ? "In-Camp" : "Post-Camp");

export default function CourseCard({ course: c, footer, base = "/app/courses" }) {
  return (
    <article className="cp-card">
      <div className="cp-badges">
        <span className={`cp-badge ${c.courseType === "in_camp" ? "cp-badge--warn" : ""}`}>{typeLabel(c.courseType)}</span>
        {c.categoryLabel && <span className="cp-badge">{c.categoryLabel}</span>}
        {c.matchesMySkills && <span className="cp-badge cp-badge--ok">Your skill set</span>}
        {c.isEnrolled &&<span className="cp-badge cp-badge--ok">Enrolled</span>}
        {c.isPublished === false && <span className="cp-badge">Draft</span>}
        {c.isRestricted && <span className="cp-badge cp-badge--warn">Restricted</span>}
      </div>
      <h3><Link to={`${base}/${c.id}`}>{c.title}</Link></h3>
      <p>{c.trainerName ? `By ${c.trainerName}` : ""}{c.trainingLocation ? ` · ${c.trainingLocation}` : ""}</p>
      <p>{c.lessonCount} lesson{c.lessonCount === 1 ? "" : "s"} · {c.freeLessonCount} free{c.paidLessonCount ? ` · ${c.paidLessonCount} premium` : ""}</p>
      <div className="cp-card-foot">
        {footer || <Link className="primary-button" to={`${base}/${c.id}`}>{c.isEnrolled ? "Open course" : "View course"}</Link>}
      </div>
    </article>
  );
}
