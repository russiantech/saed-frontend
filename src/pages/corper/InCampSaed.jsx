import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, qs } from "lib/api.js";
import { useAuth } from "lib/auth.jsx";
import Pagination from "components/ui/Pagination.jsx";
import CourseCard from "pages/corper/CourseCard.jsx";
import "styles/corper.css";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const KEYS = ["q", "skill", "campId", "year", "month", "page"];

export default function InCampSaed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer";
  const base = isTrainer ? "/app/my-courses" : "/app/courses";
  const [params, setParams] = useSearchParams();
  const query = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""]));
  const key = JSON.stringify(query);
  const [draft, setDraft] = useState(query);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api(`/incamp/courses/${qs(query)}`).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const apply = (e) => { e.preventDefault(); setParams(Object.fromEntries(Object.entries({ ...draft, page: "" }).filter(([, v]) => v))); };

  async function enrol(c) {
    setBusy(c.id);
    try {
      await api(`/courses/${c.id}/enroll/`, { method: "POST" });
      navigate(`/app/courses/${c.id}`);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  const mySkills = data?.mySkills || [];
  const mySkillNames = mySkills.map((s) => s.label).join(", ");
  const exploreAll = () => {
    setDraft((d) => ({ ...d, skill: "all" }));
    setParams(Object.fromEntries(Object.entries({ ...query, skill: "all", page: "" }).filter(([, v]) => v)));
  };

  const year = new Date().getFullYear();
  return (
    <div className="cp-page">
      <div className="cp-head"><h2>In-Camp SAED</h2>
        {data?.orientationCamp && <span className="cp-badge">{data.orientationCamp.name}</span>}
        {isTrainer && <button className="primary-button" onClick={() => navigate("/app/my-courses?new=in_camp")}>Propose a course</button>}</div>
      {isTrainer && <p className="cp-sub">Your In-Camp courses, shown exactly as corps members see them. Schedule sessions by giving lessons a date and time inside each course.</p>}
      {error && <div className="inline-message inline-message--error" role="alert">{error}</div>}
      {data && data.accessActive === false && (
        <div className="inline-message">{data.message || "Your In-Camp access has ended. Post-Camp courses remain available."}</div>
      )}
      {data && data.accessActive !== false && (
        <>
          <form className="panel cp-filters" style={{ padding: 14 }} onSubmit={apply} aria-label="Filter In-Camp courses">
            <label>Search<input value={draft.q} onChange={set("q")} /></label>
            <label>Skill set<select value={draft.skill} onChange={set("skill")} aria-label="Skill set">
              {mySkills.length > 0
                ? <option value="">My skill set ({mySkills.map((s) => s.label).join(", ")})</option>
                : <option value="">All skills</option>}
              {mySkills.length > 0 && <option value="all">All skills</option>}
              {(data.skills || []).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
            <label>Camp<select value={draft.campId} onChange={set("campId")}><option value="">All camps</option>
              {(data.camps || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Year<select value={draft.year} onChange={set("year")}><option value="">Any</option>
              {[year + 1, year, year - 1].map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
            <label>Month<select value={draft.month} onChange={set("month")}><option value="">Any</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="primary-button" type="submit">Apply</button>
              <button className="ghost-button" type="button" onClick={() => { setDraft({}); setParams({}); }}>Clear</button>
            </div>
          </form>
          {data.noSkillMatch && (
            <div className="empty-state" role="status">
              <h3>Nothing listed under your skill set yet</h3>
              <p>There are currently no In-Camp courses listed under {mySkillNames}. Check back soon, or explore what else is available.</p>
              <button className="primary-button" type="button" onClick={() => exploreAll()}>Explore other available courses</button>
            </div>
          )}
          {!data.noSkillMatch && data.courses.length === 0 && data.selectedSkill && (
            <div className="empty-state" role="status">
              <h3>Nothing listed under {data.selectedSkill.label}</h3>
              <p>There are currently no In-Camp courses listed under this skill set. Try another skill set or clear the filters.</p>
            </div>
          )}
          {!data.noSkillMatch && data.courses.length === 0 && !data.selectedSkill && <div className="empty-state"><h3>No In-Camp courses yet</h3><p>{isTrainer ? "Propose a course for your stream to see it here." : "Check back soon or try other filters."}</p></div>}
          {data.skillMode === "mine" && !data.noSkillMatch && data.courses.length > 0 && (
            <p className="cp-sub" role="status">Showing courses under your skill set ({mySkillNames}) first.</p>
          )}
          <div className="cp-grid">
            {data.courses.map((c) => (
              <CourseCard key={c.id} course={c} base={base} footer={
                <>
                  {isTrainer && <p className="cp-meta" style={{ width: "100%", margin: 0 }}>{c.enrolledCount}/{c.maxStudents} enrolled{c.orientationCamp?.name ? ` · ${c.orientationCamp.name}` : ""}</p>}
                  {!isTrainer && !c.isEnrolled && <button className="primary-button" disabled={busy === c.id} onClick={() => enrol(c)}>{busy === c.id ? "Enrolling…" : "Enrol"}</button>}
                  <button className={isTrainer ? "primary-button" : "ghost-button"} onClick={() => navigate(`${base}/${c.id}`)}>{isTrainer ? "Manage course" : c.isEnrolled ? "Open course" : "Details"}</button>
                  {c.scheduledLessons?.length > 0 && (
                    <ul className="cp-timetable" aria-label="Timetable" style={{ width: "100%" }}>
                      {c.scheduledLessons.map((l) => (
                        <li key={l.id}>{new Date(l.scheduledDate).toLocaleDateString()}{l.scheduledTime ? ` ${l.scheduledTime.slice(0, 5)}` : ""} — {l.title}{l.requiresPayment ? ` (₦${Number(l.price).toLocaleString()})` : ""}</li>
                      ))}
                    </ul>
                  )}
                </>
              } />
            ))}
          </div>
          <Pagination pagination={data.pagination} onPage={(p) => setParams(Object.fromEntries(Object.entries({ ...query, page: String(p) }).filter(([, v]) => v)))} />
        </>
      )}
      {!data && !error && <div className="empty-state">Loading…</div>}
    </div>
  );
}
