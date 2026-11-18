import { BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, GraduationCap, Tent, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "lib/api.js";
import { useAuth } from "lib/auth.jsx";
import { fmtDate } from "lib/track.js";
import StreamBanner from "components/ui/StreamBanner.jsx";
import StreamExpired from "./StreamExpired.jsx";

const Stat = ({ icon: Icon, label, value, to }) => {
  const body = (<article className="stat-card"><Icon size={22} /><span>{label}</span><strong>{value}</strong></article>);
  return to ? <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link> : body;
};

const APPROVAL = { pending: ["Pending review", "cp-badge--warn"], approved: ["Open", "cp-badge--ok"], declined: ["Declined", ""] };

/** The In-Camp portal home for corps members and trainers (separate from the Post-Camp dashboard). */
export default function InCampDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api("/incamp/dashboard/").then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);

  if (error) return <div className="inline-message inline-message--error">{error}<button type="button" className="inline-message-close" onClick={() => setError("")}><X size={16} /></button></div>;
  if (!data) return <div className="empty-state">Loading dashboard...</div>;
  if (!data.lifecycle?.isActive) return <StreamExpired lifecycle={data.lifecycle} role={data.role} />;

  const st = data.stats || {};
  const trainer = data.role === "trainer";

  return (
    <div className="dashboard-grid">
      <StreamBanner lifecycle={data.lifecycle} />
      {trainer ? (
        <>
          <section className="stat-grid">
            <Stat icon={ClipboardCheck} label="Pending review" value={st.pending || 0} to="/app/my-courses" />
            <Stat icon={CheckCircle2} label="Open courses" value={st.open || 0} to="/app/my-courses" />
            <Stat icon={Users} label="Learners" value={st.learners || 0} to="/app/corps-members" />
            <Stat icon={BookOpen} label="Lessons" value={st.lessons || 0} />
          </section>
          <section className="panel">
            <div className="panel-heading"><h2><Tent size={18} /> Your In-Camp courses</h2></div>
            {(data.courses || []).length === 0 ? (
              <div style={{ padding: "12px 16px" }}>
                <p style={{ color: "var(--muted)" }}>Tell SAED admin what you plan to teach in this stream. Submit a course proposal and it is opened once approved.</p>
                <Link className="primary-button" to="/app/my-courses?new=in_camp">Propose a course</Link>
              </div>
            ) : (
              <ul className="simple-list">
                {data.courses.map((c) => {
                  const [label, cls] = APPROVAL[c.approvalStatus] || [c.approvalStatus, ""];
                  return (
                    <li key={c.id}><Link to={`/app/my-courses/${c.id}`}><strong>{c.title}</strong></Link>
                      <span className={`cp-badge ${cls}`}>{label}</span>
                      {c.reviewNote && <small className="form-hint"> {c.reviewNote}</small>}</li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="stat-grid">
            <Stat icon={Tent} label="Courses in this stream" value={st.available || 0} to="/app/incamp" />
            <Stat icon={GraduationCap} label="In your skill set" value={st.inMySkillSet || 0} to="/app/incamp" />
            <Stat icon={BookOpen} label="Enrolled" value={st.enrolled || 0} to="/app/my-enrollments" />
            <Stat icon={CheckCircle2} label="Lessons completed" value={st.completedLessons || 0} />
          </section>
          <section className="panel">
            <div className="panel-heading"><h2><GraduationCap size={18} /> Continue learning</h2></div>
            {(data.courses || []).length === 0 ? (
              <div style={{ padding: "12px 16px" }}>
                <p style={{ color: "var(--muted)" }}>
                  {(data.mySkills || []).length ? `Courses under your skill set (${data.mySkills.map((s) => s.label).join(", ")}) are listed first.` : "Browse the courses open in your stream."}
                </p>
                <Link className="primary-button" to="/app/incamp">Browse In-Camp courses</Link>
              </div>
            ) : (
              <ul className="simple-list">
                {data.courses.map((c) => (
                  <li key={c.id}><Link to={`/app/courses/${c.id}`}><strong>{c.title}</strong></Link>
                    {c.progress && <small className="form-hint"> {c.progress.completedLessons ?? 0}/{c.progress.totalLessons ?? 0} lessons</small>}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading"><h2><CalendarDays size={18} /> Coming up</h2></div>
            {(data.schedule || []).length === 0 ? <p style={{ padding: "12px 16px", color: "var(--muted)" }}>No scheduled lessons yet.</p> : (
              <ul className="simple-list">
                {data.schedule.map((l) => (
                  <li key={l.id}><strong>{l.title}</strong> <small className="form-hint">{l.course} · {fmtDate(l.scheduledDate)}{l.scheduledTime ? ` · ${l.scheduledTime.slice(0, 5)}` : ""}</small></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <p className="form-hint">Signed in as {user?.fullName}. In-Camp accounts last for the stream.</p>
    </div>
  );
}
