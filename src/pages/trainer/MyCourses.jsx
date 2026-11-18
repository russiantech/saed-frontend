import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api } from "lib/api.js";
import { useAuth } from "lib/auth.jsx";
import { isInCamp } from "lib/track.js";
import { CATEGORY_OPTIONS } from "constants/constants.js";
import "styles/trainer.css";

const APPROVAL = { pending: ["Pending review", "tr-badge"], approved: ["Open", "tr-badge tr-badge--ok"], declined: ["Declined", "tr-badge tr-badge--lock"] };
const EMPTY = { title: "", description: "", category: "", courseType: "post_camp", orientationCampId: "", startDate: "", endDate: "",
  maxStudents: 40, trainingLocation: "", trainingLga: "", trainingState: "", isPublished: false, streamId: "" };

export default function MyCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inCamp = isInCamp(user);
  const streamIds = user?.lifecycle?.streamIds || [];
  const [streams, setStreams] = useState([]);
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState(null);
  const [camps, setCamps] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const filter = ""; // course type is fixed by the trainer's programme (the API enforces it)

  const load = useCallback(() => api(`/manage/courses/${filter ? `?courseType=${filter}` : ""}`).then((d) => setCourses(d.courses || [])).catch((e) => setError(e.message)), [filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = params.get("new");
    if (t === "in_camp" || t === "post_camp") {
      setForm({ ...EMPTY, courseType: inCamp ? "in_camp" : "post_camp", streamId: streamIds[0] ? String(streamIds[0]) : "" }); setOpen(true);
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, setParams, inCamp]);
  useEffect(() => { api("/orientation-camps/").then((d) => setCamps(d.camps || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (!inCamp) return;
    api("/streams/").then((d) => setStreams((d.streams || []).filter((s) => streamIds.includes(s.id)))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCamp]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function create(e) {
    e.preventDefault(); setSaving(true); setFields({}); setError("");
    try {
      const body = { ...form, courseType: inCamp ? "in_camp" : "post_camp",
        orientationCampId: inCamp ? form.orientationCampId || null : null, streamId: inCamp && form.streamId ? Number(form.streamId) : undefined };
      if (inCamp) { delete body.isPublished; delete body.trainingLga; delete body.trainingState; }
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
        <div>
          <h2>{inCamp ? "My In-Camp proposals" : "My Courses"}</h2>
          {inCamp && <p className="form-hint">Submit what you want to teach in your stream. SAED admin reviews it and opens it to corps members.</p>}
        </div>
        <div className="tr-actions">
          <button className="primary-button" onClick={() => {
            setForm({ ...EMPTY, courseType: inCamp ? "in_camp" : "post_camp", streamId: streamIds[0] ? String(streamIds[0]) : "" });
            setOpen(true);
          }}>{inCamp ? "Propose a course" : "New course"}</button>
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
                <span className="tr-badge">{c.courseType === "in_camp" ? `In-Camp${c.stream ? ` · ${c.stream.name}` : ""}` : "Post-Camp"}</span>
                {c.courseType === "in_camp"
                  ? <span className={APPROVAL[c.approvalStatus]?.[1] || "tr-badge"}>{APPROVAL[c.approvalStatus]?.[0] || c.approvalStatus}</span>
                  : <span className={`tr-badge ${c.isPublished ? "tr-badge--ok" : ""}`}>{c.isPublished ? "Published" : "Draft"}</span>}
                {c.isRestricted && <span className="tr-badge tr-badge--lock">Restricted</span>}
              </div>
              <h3><Link to={`/app/my-courses/${c.id}`}>{c.title}</Link></h3>
              {c.courseType === "in_camp" && c.approvalStatus === "declined" && c.reviewNote && <p className="tr-err">Declined: {c.reviewNote}</p>}
              <p>{c.lessonCount} lessons · {c.paidLessonCount} locked · {c.enrolledCount}/{c.maxStudents} enrolled</p>
              <div className="tr-actions" style={{ marginTop: "auto" }}>
                <Link className="primary-button" to={`/app/my-courses/${c.id}`}>Manage</Link>
                {(c.courseType !== "in_camp" || c.approvalStatus === "approved") && (
                  <button className="ghost-button" onClick={() => togglePublish(c)}>{c.isPublished ? "Unpublish" : "Publish"}</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label="New course" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{inCamp ? "Propose an In-Camp course" : "New course"}</h3>
            {error && <div className="inline-message inline-message--error">{error}</div>}
            <form className="tr-form" onSubmit={create}>
              <label className="wide">Title<input value={form.title} onChange={set("title")} required />{err("title")}</label>
              {inCamp && (
                <label>Stream
                  <select value={form.streamId} onChange={set("streamId")} required>
                    <option value="">Select stream…</option>{streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {err("streamId")}
                </label>
              )}
              <label>Skill area
                <select value={form.category} onChange={set("category")}><option value="">Select…</option>{CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </label>
              {inCamp && (
                <label className="wide">Orientation camp (optional)
                  <select value={form.orientationCampId} onChange={set("orientationCampId")}><option value="">Any camp in the stream</option>{camps.filter((c) => !form.streamId || String(c.streamId) === String(form.streamId)).map((c) => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}</select>
                  {err("orientationCampId")}
                </label>
              )}
              <label>Start date<input type="date" value={form.startDate} onChange={set("startDate")} />{err("startDate")}</label>
              <label>End date<input type="date" value={form.endDate} onChange={set("endDate")} />{err("endDate")}</label>
              <label>Max students<input type="number" min="1" value={form.maxStudents} onChange={set("maxStudents")} />{err("maxStudents")}</label>
              <label>Training location<input value={form.trainingLocation} onChange={set("trainingLocation")} /></label>
              {!inCamp && <label>State<input value={form.trainingState} onChange={set("trainingState")} /></label>}
              {!inCamp && <label>LGA<input value={form.trainingLga} onChange={set("trainingLga")} /></label>}
              <label className="wide">Description<textarea rows={3} value={form.description} onChange={set("description")} /></label>
              {!inCamp && <label className="wide" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} style={{ width: "auto" }} /> Publish now (visible to corps members)</label>}
              <div className="wide tr-actions"><button className="primary-button" disabled={saving}>{saving ? "Submitting…" : inCamp ? "Submit proposal" : "Create course"}</button><button type="button" className="ghost-button" onClick={() => setOpen(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
