import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "lib/api.js";
import "styles/trainer.css";

export default function CorperProfile() {
  const { corperId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api(`/trainer/corpers/${corperId}/`).then(setData).catch((e) => setError(e.message)); }, [corperId]);

  if (error) return <div className="inline-message inline-message--error">{error}</div>;
  if (!data) return <div className="empty-state">Loading…</div>;
  const { corper, courses } = data;
  const rows = [["Email", corper.email], ["Phone", corper.phone], ["State code", corper.stateCode], ["Skill interest", corper.skillInterest],
    ["State of deployment", corper.stateOfDeployment], ["LGA", corper.lgaOfDeployment], ["PPA", corper.ppa]].filter(([, v]) => v);

  return (
    <div className="tr-page">
      <button className="ghost-button" style={{ justifySelf: "start" }} onClick={() => navigate("/app/corps-members")}>← Corps Members</button>
      <section className="panel" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>{corper.fullName}</h2>
        <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "4px 16px", margin: 0 }}>
          {rows.map(([k, v]) => (<><dt key={k} style={{ color: "var(--muted)" }}>{k}</dt><dd key={`${k}v`} style={{ margin: 0 }}>{v}</dd></>))}
        </dl>
      </section>
      <h3>Your courses</h3>
      {courses.length === 0 ? <div className="empty-state">You have no courses yet.</div> : courses.map((c) => (
        <div key={c.id} className="tr-row">
          <div className="tr-row-main"><strong><Link to={`/app/my-courses/${c.id}`}>{c.title}</Link></strong>
            <small>{c.lessonCount} lessons · {c.enrolledCount}/{c.maxStudents} enrolled</small></div>
          <span className={`tr-badge ${c.isEnrolled ? "tr-badge--ok" : ""}`}>{c.isEnrolled ? `Enrolled (${c.enrollmentStatus})` : "Not enrolled"}</span>
        </div>
      ))}
    </div>
  );
}
