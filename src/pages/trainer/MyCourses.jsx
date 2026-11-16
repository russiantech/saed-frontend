import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api } from "lib/api.js";
import { CATEGORY_OPTIONS } from "constants/constants.js";
import "styles/trainer.css";

const EMPTY = { title: "", description: "", category: "", courseType: "post_camp", orientationCampId: "", startDate: "", endDate: "",
  maxStudents: 40, trainingLocation: "", trainingLga: "", trainingState: "", isPublished: false };

export default function MyCourses() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState(null);
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => api(`/manage/courses/${filter ? `?courseType=${filter}` : ""}`).then((d) => setCourses(d.courses || [])).catch((e) => setError(e.message)), [filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = params.get("new");
    if (t === "in_camp" || t === "post_camp") {
      setForm({ ...EMPTY, courseType: t }); setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => { api("/orientation-camps/").then((d) => setCamps(d.camps || [])).catch(() => {}); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function create(e) {
    e.preventDefault(); setSaving(true); setFields({}); setError("");
    try {
      const body = { ...form, orientationCampId: form.courseType === "in_camp" ? form.orientationCampId || null : null };
      const r = await api("/manage/courses/", { method: "POST", body });
      navigate(`/app/my-courses/${r.course.id}`);
    } catch (err) { setError(err.message); setFields(err.data?.fields || {}); } finally { setSaving(false); }
  }

  async function togglePublish(c) {
    try { await api(`/manage/courses/${c.id}/`, { method: "PATCH", body: { isPublished: !c.isPublished } }); load(); } catch (e) { setError(e.message); }
  }

  const err = (k) => fields[k] && <span className="tr-err">{fields[k]}</span>;

  return (
    <div className="tr-page">
      <div className="tr-head">
        <h2>My Courses</h2>
        <div className="tr-actions">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by type">
            <option value="">All types</option><option value="in_camp">In-Camp</option><option value="post_camp">Post-Camp</option>
          </select>
          <button className="primary-button" onClick={() => setOpen(true)}>New course</button>
        </div>
      </div>
      {error && !open && <div className="inline-message inline-message--error">{error}</div>}
      {!courses ? <div className="empty-state">Loading…</div> : courses.length === 0 ? (
        <div className="empty-state"><h3>No courses yet</h3><p>Create a course, then add lessons. Lessons are free unless you lock and price them.</p></div>
      ) : (
        <div className="tr-grid">
          {courses.map((c) => (
            <article key={c.id} className="tr-card">
              <div className="tr-actions">
                <span className="tr-badge">{c.courseType === "in_camp" ? "In-Camp" : "Post-Camp"}</span>
                <span className={`tr-badge ${c.isPublished ? "tr-badge--ok" : ""}`}>{c.isPublished ? "Published" : "Draft"}</span>
                {c.isRestricted && <span className="tr-badge tr-badge--lock">Restricted</span>}
              </div>
              <h3><Link to={`/app/my-courses/${c.id}`}>{c.title}</Link></h3>
              <p>{c.lessonCount} lessons · {c.paidLessonCount} locked · {c.enrolledCount}/{c.maxStudents} enrolled</p>
              <div className="tr-actions" style={{ marginTop: "auto" }}>
                <Link className="primary-button" to={`/app/my-courses/${c.id}`}>Manage</Link>
                <button className="ghost-button" onClick={() => togglePublish(c)}>{c.isPublished ? "Unpublish" : "Publish"}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label="New course" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>New course</h3>
            {error && <div className="inline-message inline-message--error">{error}</div>}
            <form className="tr-form" onSubmit={create}>
              <label className="wide">Title<input value={form.title} onChange={set("title")} required />{err("title")}</label>
              <label>Type
                <select value={form.courseType} onChange={set("courseType")}><option value="post_camp">Post-Camp</option><option value="in_camp">In-Camp</option></select>
                {err("courseType")}
              </label>
              <label>Skill area
                <select value={form.category} onChange={set("category")}><option value="">Select…</option>{CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </label>
              {form.courseType === "in_camp" && (
                <label className="wide">Orientation camp
                  <select value={form.orientationCampId} onChange={set("orientationCampId")}><option value="">Select camp…</option>{camps.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}</select>
                  {err("orientationCampId")}
                </label>
              )}
              <label>Start date<input type="date" value={form.startDate} onChange={set("startDate")} />{err("startDate")}</label>
              <label>End date<input type="date" value={form.endDate} onChange={set("endDate")} />{err("endDate")}</label>
              <label>Max students<input type="number" min="1" value={form.maxStudents} onChange={set("maxStudents")} />{err("maxStudents")}</label>
              <label>Training location<input value={form.trainingLocation} onChange={set("trainingLocation")} /></label>
              <label>State<input value={form.trainingState} onChange={set("trainingState")} /></label>
              <label>LGA<input value={form.trainingLga} onChange={set("trainingLga")} /></label>
              <label className="wide">Description<textarea rows={3} value={form.description} onChange={set("description")} /></label>
              <label className="wide" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} style={{ width: "auto" }} /> Publish now (visible to corps members)</label>
              <div className="wide tr-actions"><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create course"}</button><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
