import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api, qs } from "lib/api.js";
import Pagination from "components/ui/Pagination.jsx";
import CourseCard from "pages/corper/CourseCard.jsx";
import { SKILL_AREA_OPTIONS } from "constants/constants.js";
import "styles/corper.css";

const KEYS = ["q", "skill", "state", "lga", "ppa", "location", "page"];

function TrainerCard({ t, connected }) {
  return (
    <article className="cp-card">
      <div className="cp-badges">
        {t.isVerified && <span className="cp-badge cp-badge--ok">Verified</span>}
        {connected && <span className="cp-badge cp-badge--ok">Connected</span>}
        {t.specialization && <span className="cp-badge">{t.specialization}</span>}
      </div>
      <h3><Link to={`/app/trainers/${t.id}`}>{t.fullName}</Link></h3>
      <p>{[t.companyName, t.stateOfDeployment, t.lgaOfDeployment].filter(Boolean).join(" · ")}</p>
      <p>{t.courseCount != null ? `${t.courseCount} course${t.courseCount === 1 ? "" : "s"}` : ""}{t.yearsExperience ? ` · ${t.yearsExperience} yrs experience` : ""}</p>
      <div className="cp-card-foot"><Link className="primary-button" to={`/app/trainers/${t.id}`}>View trainer</Link></div>
    </article>
  );
}

function TrainerDetail({ id }) {
  const [t, setT] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => { api(`/trainers/${id}/`).then(setT).catch((e) => setError(e.message)); }, [id]);
  if (error) return <div className="inline-message inline-message--error">{error}</div>;
  if (!t) return <div className="empty-state">Loading trainer…</div>;
  return (
    <div className="cp-page">
      <button type="button" className="ghost-button" onClick={() => navigate(-1)} style={{ justifySelf: "start" }}>← Back</button>
      <section className="panel" style={{ padding: 20, display: "grid", gap: 8 }}>
        <h2 style={{ margin: 0 }}>{t.fullName}</h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>{[t.specialization, t.companyName].filter(Boolean).join(" · ")}</p>
        {t.bio && <p>{t.bio}</p>}
        <p style={{ margin: 0, fontSize: 13 }}>{[t.stateOfDeployment, t.lgaOfDeployment, t.ppa].filter(Boolean).join(" · ")}</p>
        {t.connectionStatus && t.connectionStatus !== "none" && <span className="cp-badge cp-badge--ok" style={{ justifySelf: "start" }}>Connected</span>}
      </section>
      <h3>Courses by {t.fullName}</h3>
      {t.courses?.length ? (
        <div className="cp-grid">{t.courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      ) : <div className="empty-state">This trainer has no published courses yet.</div>}
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Enrolling in any course connects you to this trainer automatically.</p>
    </div>
  );
}

export default function Trainers() {
  const { trainerId } = useParams();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState("");
  const query = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""]));
  const [draft, setDraft] = useState(query);
  const key = JSON.stringify(query);

  const load = useCallback(() => {
    api(`/trainers/${qs(query)}`).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { if (!trainerId) load(); }, [load, trainerId]);
  useEffect(() => { api("/my-trainers/").then((d) => setMine(d.trainers || [])).catch(() => {}); }, []);

  if (trainerId) return <TrainerDetail id={trainerId} />;

  const apply = (e) => { e.preventDefault(); setParams(Object.fromEntries(Object.entries({ ...draft, page: "" }).filter(([, v]) => v))); };
  const reset = () => { setDraft(Object.fromEntries(KEYS.map((k) => [k, ""]))); setParams({}); };
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const connectedIds = new Set(mine.map((m) => m.id));

  return (
    <div className="cp-page">
      <div className="cp-head"><h2>Trainers</h2></div>
      <div className="cp-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "all"} className="cp-tab" onClick={() => setTab("all")}>All trainers</button>
        <button role="tab" aria-selected={tab === "mine"} className="cp-tab" onClick={() => setTab("mine")}>My trainers ({mine.length})</button>
      </div>

      {tab === "all" && (
        <>
          <form className="cp-filters" onSubmit={apply}>
            <label>Name<input value={draft.q} onChange={set("q")} placeholder="Any" /></label>
            <label>Skill
              <select value={draft.skill} onChange={set("skill")}>
                <option value="">Any</option>
                {SKILL_AREA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>State<input value={draft.state} onChange={set("state")} placeholder="Any" /></label>
            <label>LGA<input value={draft.lga} onChange={set("lga")} placeholder="Any" /></label>
            <label>PPA<input value={draft.ppa} onChange={set("ppa")} placeholder="Any" /></label>
            <label>Location<input value={draft.location} onChange={set("location")} placeholder="Any" /></label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="primary-button" type="submit">Filter</button>
              <button className="ghost-button" type="button" onClick={reset}>Clear</button>
            </div>
          </form>
          {error && <div className="inline-message inline-message--error">{error}</div>}
          {!data && !error && <div className="empty-state">Loading trainers…</div>}
          {data && (data.trainers.length ? (
            <>
              <div className="cp-grid">{data.trainers.map((t) => <TrainerCard key={t.id} t={t} connected={connectedIds.has(t.id)} />)}</div>
              <Pagination pagination={data.pagination} onPage={(p) => setParams(Object.fromEntries(Object.entries({ ...query, page: String(p) }).filter(([, v]) => v)))} />
            </>
          ) : <div className="empty-state">No trainers match these filters. Clear a filter to see more.</div>)}
        </>
      )}

      {tab === "mine" && (mine.length ? (
        <div className="cp-grid">{mine.map((t) => <TrainerCard key={t.id} t={{ ...t, courseCount: t.courses?.length }} connected />)}</div>
      ) : <div className="empty-state">You aren’t connected to a trainer yet. Enrol in a course and you’ll be connected automatically.</div>)}
    </div>
  );
}
