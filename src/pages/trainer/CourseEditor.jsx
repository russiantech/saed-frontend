import { ArrowDown, ArrowUp, Lock, Pencil, Trash2, Unlock, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, uploadWithProgress } from "lib/api.js";
import { naira, payFlow } from "lib/payments.js";
import { CATEGORY_OPTIONS } from "constants/constants.js";
import "styles/trainer.css";

const EMPTY_LESSON = { title: "", description: "", contentType: "video", textContent: "", scheduledDate: "", scheduledTime: "", isLocked: false, price: "", isPublished: true };

export default function CourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [details, setDetails] = useState(null);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // lesson object or {} for new
  const [requests, setRequests] = useState([]);
  const [accessFor, setAccessFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await api(`/manage/courses/${courseId}/`);
      setData(d); setDetails((cur) => cur || d.course);
      setError("");
    } catch (e) { setError(e.message); }
    api("/manage/access-requests/").then((r) => setRequests((r.requests || []).filter((x) => x.courseId === courseId))).catch(() => {});
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <div className="inline-message inline-message--error">{error}</div>;
  if (!data) return <div className="empty-state">Loading…</div>;
  const { course, lessons } = data;

  async function saveDetails(e) {
    e.preventDefault(); setSaving(true); setFields({}); setNotice(null);
    try {
      const { startDate, endDate, title, description, category, maxStudents, trainingLocation, trainingState, trainingLga } = details;
      await api(`/manage/courses/${courseId}/`, { method: "PATCH", body: { startDate, endDate, title, description, category, maxStudents, trainingLocation, trainingState, trainingLga } });
      setNotice({ type: "success", text: "Course saved." }); load();
    } catch (err) { setNotice({ type: "error", text: err.message }); setFields(err.data?.fields || {}); } finally { setSaving(false); }
  }

  async function togglePublish() {
    try { await api(`/manage/courses/${courseId}/`, { method: "PATCH", body: { isPublished: !course.isPublished } }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  async function removeCourse() {
    if (!window.confirm("Delete this course and all its lessons? This cannot be undone.")) return;
    try { await api(`/manage/courses/${courseId}/`, { method: "DELETE" }); navigate("/app/my-courses"); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  async function move(i, dir) {
    const ids = lessons.map((l) => l.id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try { await api(`/manage/courses/${courseId}/lessons/reorder/`, { method: "POST", body: { order: ids } }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  async function removeLesson(l) {
    if (!window.confirm(`Delete lesson “${l.title}”?`)) return;
    try { await api(`/manage/lessons/${l.id}/`, { method: "DELETE" }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  async function quickLock(l) {
    try {
      if (l.isLocked) await api(`/manage/lessons/${l.id}/`, { method: "PATCH", body: { isLocked: false } });
      else setEditing(l);
      load();
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  }
  async function confirmTransfer(r) {
    try { await api(`/manage/lessons/${r.lessonId}/grant/`, { method: "POST", body: { studentId: r.studentId, note: "Bank transfer confirmed" } }); load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }

  const d = details || course;
  const setD = (k) => (e) => setDetails((x) => ({ ...(x || course), [k]: e.target.value }));
  const err = (k) => fields[k] && <span className="tr-err">{fields[k]}</span>;

  return (
    <div className="tr-page">
      <div className="tr-head">
        <div>
          <Link to="/app/my-courses">← My Courses</Link>
          <h2 style={{ margin: "4px 0 0" }}>{course.title}</h2>
          <div className="tr-actions" style={{ marginTop: 6 }}>
            <span className="tr-badge">{course.courseType === "in_camp" ? "In-Camp" : "Post-Camp"}</span>
            <span className={`tr-badge ${course.isPublished ? "tr-badge--ok" : ""}`}>{course.isPublished ? "Published" : "Draft"}</span>
            <span className="tr-badge"><Users size={11} /> {course.enrolledCount}/{course.maxStudents}</span>
          </div>
        </div>
        <div className="tr-actions">
          <Link className="ghost-button" to={`/app/courses/${course.id}`}>Preview as student</Link>
          <button className="ghost-button" onClick={togglePublish}>{course.isPublished ? "Unpublish" : "Publish"}</button>
          <button className="ghost-button" onClick={removeCourse}><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      {notice && <div className={`inline-message inline-message--${notice.type}`} role="status">{notice.text}</div>}

      {requests.length > 0 && (
        <section className="panel" style={{ padding: 16, display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Bank-transfer requests ({requests.length})</h3>
          {requests.map((r) => (
            <div key={r.id} className="tr-row">
              <div className="tr-row-main"><strong>{r.studentName}</strong><small>{r.lessonTitle} · {naira(r.amountPaid || 0) !== "₦0" ? naira(r.amountPaid) : ""}</small></div>
              <button className="primary-button" onClick={() => confirmTransfer(r)}>Confirm payment received &amp; unlock</button>
            </div>
          ))}
        </section>
      )}

      <section className="panel" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Course details</h3>
        <form className="tr-form" onSubmit={saveDetails}>
          <label className="wide">Title<input value={d.title || ""} onChange={setD("title")} />{err("title")}</label>
          <label>Skill area<select value={d.category || ""} onChange={setD("category")}><option value="">Select…</option>{CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
          <label>Max students<input type="number" min="1" value={d.maxStudents || ""} onChange={setD("maxStudents")} />{err("maxStudents")}</label>
          <label>Start date<input type="date" value={d.startDate || ""} onChange={setD("startDate")} />{err("startDate")}</label>
          <label>End date<input type="date" value={d.endDate || ""} onChange={setD("endDate")} />{err("endDate")}</label>
          <label>Training location<input value={d.trainingLocation || ""} onChange={setD("trainingLocation")} /></label>
          <label>State<input value={d.trainingState || ""} onChange={setD("trainingState")} /></label>
          <label>LGA<input value={d.trainingLga || ""} onChange={setD("trainingLga")} /></label>
          <label className="wide">Description<textarea rows={3} value={d.description || ""} onChange={setD("description")} /></label>
          <div className="wide"><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save details"}</button></div>
        </form>
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        <div className="tr-head">
          <h3 style={{ margin: 0 }}>Lessons ({lessons.length})</h3>
          <button className="primary-button" onClick={() => setEditing({})}>Add lesson</button>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Lessons are free by default. Lock a lesson and set a price to make it premium. Ordinary documents are always free to upload.</p>
        {lessons.length === 0 && <div className="empty-state">No lessons yet. Add your first lesson.</div>}
        {lessons.map((l, i) => (
          <div key={l.id} className="tr-row">
            <div className="tr-row-main">
              <strong>{i + 1}. {l.title}</strong>
              <small>
                {l.requiresPayment ? <span className="tr-badge tr-badge--lock"><Lock size={10} /> Locked · {naira(l.price)}</span> : <span className="tr-badge tr-badge--ok">Free</span>}
                {" "}{l.hasVideo ? "Video · " : ""}{l.hasDocument ? "Document · " : ""}{l.hasText ? "Text · " : ""}{!l.isPublished ? "Hidden" : ""}
                {l.scheduledDate ? ` · ${l.scheduledDate}${l.scheduledTime ? ` ${l.scheduledTime.slice(0, 5)}` : ""}` : ""}
              </small>
            </div>
            <div className="tr-actions">
              <button className="ghost-button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
              <button className="ghost-button" aria-label="Move down" disabled={i === lessons.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
              <button className="ghost-button" onClick={() => quickLock(l)}>{l.isLocked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}</button>
              {l.requiresPayment && <button className="ghost-button" onClick={() => setAccessFor(l)}>Access</button>}
              <button className="ghost-button" onClick={() => setEditing(l)}><Pencil size={14} /> Edit</button>
              <button className="ghost-button" aria-label="Delete lesson" onClick={() => removeLesson(l)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </section>

      {editing && <LessonDialog courseId={courseId} lesson={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} onNotice={setNotice} />}
      {accessFor && <AccessDialog lesson={accessFor} onClose={() => { setAccessFor(null); load(); }} />}
    </div>
  );
}

function LessonDialog({ courseId, lesson, onClose, onSaved, onNotice }) {
  const isNew = !lesson.id;
  const [form, setForm] = useState(() => isNew ? EMPTY_LESSON : {
    title: lesson.title, description: lesson.description || "", contentType: lesson.contentType, textContent: lesson.hasText ? "" : "",
    scheduledDate: lesson.scheduledDate || "", scheduledTime: (lesson.scheduledTime || "").slice(0, 5), isLocked: lesson.isLocked,
    price: Number(lesson.price) > 0 ? lesson.price : "", isPublished: lesson.isPublished, videoLink: lesson.videoLink || "" });
  const [cur, setCur] = useState(lesson);
  const [fields, setFields] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [fee, setFee] = useState(null); // 402 payload awaiting confirmation
  const [pending, setPending] = useState(null); // upload/link to retry after paying

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const err = (k) => fields[k] && <span className="tr-err">{fields[k]}</span>;

  async function save(e) {
    e?.preventDefault(); setBusy(true); setFields({}); setMsg("");
    try {
      const body = { ...form, price: form.isLocked ? form.price : form.price || 0 };
      if (!form.textContent && !isNew) delete body.textContent; // don't wipe existing text unless edited
      delete body.videoLink; // links go through the fee-aware path below
      let r;
      if (isNew) r = await api("/manage/lessons/", { method: "POST", body: { ...body, courseId } });
      else r = await api(`/manage/lessons/${cur.id}/`, { method: "PATCH", body });
      setCur(r.lesson);
      return r.lesson;
    } catch (er) { setMsg(er.message); setFields(er.data?.fields || {}); return null; } finally { setBusy(false); }
  }

  async function saveAndClose(e) {
    const l = await save(e);
    if (l) { if (isNew) { setCur(l); setMsg("Lesson created. You can now attach a video or document."); onNotice({ type: "success", text: "Lesson created." }); } else onSaved(); }
  }

  async function ensureLesson() { return cur.id ? cur : save(); }

  async function doUpload(l, kind, file) {
    setProgress(0); setMsg("");
    try {
      const fd = new FormData(); fd.append("kind", kind); fd.append("file", file);
      const r = await uploadWithProgress(`/manage/lessons/${l.id}/upload/`, fd, setProgress);
      setCur(r.lesson); setPending(null); setFee(null);
      onNotice({ type: "success", text: `${kind === "video" ? "Video" : "Document"} uploaded.` });
    } catch (er) {
      if (er.status === 402 && er.data?.requiresVideoUploadPayment) { setFee(er.data); setPending({ kind, file, lesson: l }); }
      else setMsg(er.message);
    } finally { setProgress(null); }
  }

  async function pickFile(kind, file) {
    if (!file) return;
    const l = await ensureLesson();
    if (l) doUpload(l, kind, file);
  }

  async function saveVideoLink() {
    const l = await ensureLesson(); if (!l) return;
    setMsg("");
    try {
      const r = await api(`/manage/lessons/${l.id}/`, { method: "PATCH", body: { videoLink: form.videoLink || "" } });
      setCur(r.lesson); onNotice({ type: "success", text: "Video link saved." });
    } catch (er) {
      if (er.status === 402 && er.data?.requiresVideoUploadPayment) { setFee(er.data); setPending({ link: true, lesson: l }); } else setMsg(er.message);
    }
  }

  async function payFee() {
    setBusy(true); setMsg("");
    try {
      const r = await payFlow("/payments/video-upload/", { lessonId: pending.lesson.id });
      if (r.status === "success") {
        setFee(null);
        if (pending.link) { setPending(null); await saveVideoLink(); } else await doUpload(pending.lesson, pending.kind, pending.file);
      } else if (r.status === "mismatch") setMsg("Your payment is under review. You haven't lost your money; you'll be notified as soon as it is confirmed.");
      else if (r.status === "pending") setMsg("Payment is still processing. Try the upload again in a minute.");
      else if (r.status === "closed") setMsg("Payment window closed. No money was taken.");
      else setMsg(r.message || "Payment was not completed. No money was taken.");
    } catch (er) { setMsg(er.message); } finally { setBusy(false); }
  }

  async function removeFile(kind) {
    try { const r = await api(`/manage/lessons/${cur.id}/upload/?kind=${kind}`, { method: "DELETE" }); setCur(r.lesson); } catch (er) { setMsg(er.message); }
  }

  return (
    <div className="tr-modal" role="dialog" aria-modal="true" aria-label={isNew ? "Add lesson" : "Edit lesson"}>
      <div>
        <h3 style={{ marginTop: 0 }}>{cur.id ? "Edit lesson" : "Add lesson"}</h3>
        {msg && <div className="inline-message inline-message--error" role="alert">{msg}</div>}
        <form className="tr-form" onSubmit={saveAndClose}>
          <label className="wide">Title<input value={form.title} onChange={set("title")} required />{err("title")}</label>
          <label className="wide">Description<textarea rows={2} value={form.description} onChange={set("description")} /></label>
          <label>Main content
            <select value={form.contentType} onChange={set("contentType")}><option value="video">Video</option><option value="document">Document</option><option value="text">Text</option></select>
          </label>
          <label>Scheduled date (optional)<input type="date" value={form.scheduledDate} onChange={set("scheduledDate")} />{err("scheduledDate")}</label>
          <label>Scheduled time<input type="time" value={form.scheduledTime} onChange={set("scheduledTime")} />{err("scheduledTime")}</label>
          <label className="wide">Text notes<textarea rows={4} value={form.textContent} onChange={set("textContent")} placeholder={cur.hasText ? "Text exists. Type here to replace it." : ""} /></label>

          <fieldset className="wide" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
            <legend>Access</legend>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={form.isLocked} onChange={set("isLocked")} style={{ width: "auto" }} /> Lock this lesson (corps members pay to open it)
            </label>
            {form.isLocked ? (
              <label style={{ marginTop: 8 }}>Price (₦)<input type="number" min="1" step="1" value={form.price} onChange={set("price")} />{err("price")}</label>
            ) : <small style={{ color: "var(--muted)" }}>Unlocked: this lesson is free for every enrolled corps member.</small>}
          </fieldset>

          <fieldset className="wide" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
            <legend>Files</legend>
            <div>
              <strong>Video</strong>{" "}
              {cur.hasVideo && <span className="tr-badge tr-badge--ok">{cur.videoFileName || "Linked"}</span>}
              <input type="file" accept="video/*" onChange={(e) => pickFile("video", e.target.files[0])} disabled={progress !== null} />
              <label style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input placeholder="…or paste a video link (YouTube, Vimeo, MP4)" value={form.videoLink || ""} onChange={set("videoLink")} />
                <button type="button" className="ghost-button" onClick={saveVideoLink}>Save link</button>
              </label>
              {cur.hasVideo && <button type="button" className="ghost-button" onClick={() => removeFile("video")}>Remove video</button>}
            </div>
            <div>
              <strong>Document (PDF, image or text) — free</strong>{" "}
              {cur.hasDocument && <span className="tr-badge tr-badge--ok">{cur.documentFileName || "Uploaded"}</span>}
              <input type="file" accept=".pdf,.txt,.jpg,.jpeg,.png,.webp" onChange={(e) => pickFile("document", e.target.files[0])} disabled={progress !== null} />
              {cur.hasDocument && <button type="button" className="ghost-button" onClick={() => removeFile("document")}>Remove document</button>}
            </div>
            {progress !== null && <div><div className="tr-progress"><span style={{ width: `${progress}%` }} /></div><small>Uploading… {progress}%</small></div>}
          </fieldset>

          <label className="wide" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} style={{ width: "auto" }} /> Visible to students
          </label>
          <div className="wide tr-actions">
            <button className="primary-button" disabled={busy}>{busy ? "Saving…" : cur.id && !isNew ? "Save lesson" : cur.id ? "Save changes" : "Create lesson"}</button>
            <button type="button" className="ghost-button" onClick={cur.id ? onSaved : onClose}>{cur.id ? "Done" : "Cancel"}</button>
          </div>
        </form>

        {fee && (
          <div className="tr-modal" role="alertdialog" aria-label="Video upload fee">
            <div>
              <h3 style={{ marginTop: 0 }}>Video upload fee</h3>
              <p>A one-off fee of <strong>{naira(fee.feeAmount)}</strong> applies to add a video to this lesson. It is set by Dunis Admin and is separate from what corps members pay for premium lessons. Documents and text are always free.</p>
              <div className="tr-actions">
                <button className="primary-button" onClick={payFee} disabled={busy}>{busy ? "Opening Paystack…" : `Pay ${naira(fee.feeAmount)} & continue`}</button>
                <button className="ghost-button" onClick={() => { setFee(null); setPending(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessDialog({ lesson, onClose }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => api(`/manage/lessons/${lesson.id}/access/`).then(setData).catch((e) => setMsg(e.message)), [lesson.id]);
  useEffect(() => { load(); }, [load]);
  async function act(kind, studentId) {
    setMsg("");
    try { await api(`/manage/lessons/${lesson.id}/${kind}/`, { method: "POST", body: { studentId } }); load(); } catch (e) { setMsg(e.message); }
  }
  return (
    <div className="tr-modal" role="dialog" aria-modal="true" aria-label="Lesson access" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Access · {lesson.title}</h3>
        {msg && <div className="inline-message inline-message--error">{msg}</div>}
        {!data ? "Loading…" : (
          <div style={{ display: "grid", gap: 14 }}>
            <section>
              <h4>Students with access or requests</h4>
              {data.access.length === 0 && <p style={{ color: "var(--muted)" }}>Nobody yet.</p>}
              {data.access.map((a) => (
                <div key={a.id} className="tr-row">
                  <div className="tr-row-main"><strong>{a.studentName}</strong><small>{a.status} · {a.source.replace("_", " ")}</small></div>
                  {a.status === "active" ? <button className="ghost-button" onClick={() => act("revoke", a.studentId)}>Revoke</button>
                    : <button className="primary-button" onClick={() => act("grant", a.studentId)}>{a.status === "requested" ? "Confirm & unlock" : "Grant"}</button>}
                </div>
              ))}
            </section>
            <section>
              <h4>Grant access to an enrolled student</h4>
              {data.eligibleStudents.length === 0 && <p style={{ color: "var(--muted)" }}>No other enrolled students.</p>}
              {data.eligibleStudents.map((s) => (
                <div key={s.id} className="tr-row"><div className="tr-row-main"><strong>{s.fullName}</strong><small>{s.email}</small></div>
                  <button className="ghost-button" onClick={() => act("grant", s.id)}>Grant free access</button></div>
              ))}
            </section>
          </div>
        )}
        <div style={{ marginTop: 12 }}><button className="ghost-button" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
