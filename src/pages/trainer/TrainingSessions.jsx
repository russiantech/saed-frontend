import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit, X, Calendar } from "lucide-react";
import { api } from "../../lib/api.js";

const empty = {
  courseId: "",
  title: "",
  description: "",
  scheduledDate: "",
  startTime: "",
  endTime: "",
  venue: "",
};

export default function TrainingSessions() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const inCampCourses = courses.filter((c) => c.courseType === "in_camp");

  function load() {
    setLoading(true);
    Promise.all([
      api("/manage/training-sessions/"),
      api("/manage/courses/"),
    ])
      .then(([s, c]) => {
        setSessions(s.sessions || []);
        setCourses(c.courses || []);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const body = {
      ...form,
      courseId: form.courseId,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
    };
    try {
      if (editingId) {
        await api(`/manage/training-sessions/${editingId}/`, { method: "PATCH", body });
      } else {
        await api("/manage/training-sessions/", { method: "POST", body });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this session?")) return;
    try {
      await api(`/manage/training-sessions/${id}/`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page-container"><div className="empty-state">Loading sessions...</div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/app/my-courses" className="back-link">← My Courses</Link>
          <h1><Calendar size={22} style={{ verticalAlign: "middle", marginRight: 8 }} />In-Camp Sessions</h1>
          <p style={{ color: "var(--muted)" }}>Schedule training sessions for In-Camp programmes</p>
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={inCampCourses.length === 0}
          onClick={() => { setEditingId(null); setForm(empty); setShowForm(true); }}
        >
          <Plus size={16} /> Schedule session
        </button>
      </div>

      {error && (
        <div className="inline-message inline-message--error">
          {error}
          <button type="button" className="inline-message-close" onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {inCampCourses.length === 0 && (
        <section className="panel" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Create an <strong>In-Camp</strong> course first under My Courses, then schedule sessions here.
          </p>
        </section>
      )}

      <section className="panel">
        {sessions.length === 0 ? (
          <p style={{ padding: 16, color: "var(--muted)" }}>No sessions scheduled yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  opacity: s.isCancelled ? 0.6 : 1,
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{s.title || s.courseTitle}</strong>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {s.courseTitle} · {s.scheduledDate}
                    {s.startTime ? ` · ${String(s.startTime).slice(0, 5)}` : ""}
                    {s.venue ? ` · ${s.venue}` : ""}
                    {s.isCancelled ? " · Cancelled" : ""}
                  </div>
                </div>
                <button className="icon-action" type="button" onClick={() => {
                  setEditingId(s.id);
                  setForm({
                    courseId: String(s.courseId),
                    title: s.title || "",
                    description: s.description || "",
                    scheduledDate: s.scheduledDate || "",
                    startTime: s.startTime ? String(s.startTime).slice(0, 5) : "",
                    endTime: s.endTime ? String(s.endTime).slice(0, 5) : "",
                    venue: s.venue || "",
                  });
                  setShowForm(true);
                }}><Edit size={15} /></button>
                <button className="icon-action danger" type="button" onClick={() => handleDelete(s.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 480 }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "Edit session" : "Schedule session"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>
                In-Camp course *
                <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Select course</option>
                  {inCampCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </label>
              <label>Title <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Optional session title" /></label>
              <label>Description <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label>Date * <input type="date" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label>Start time <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label>
                <label>End time <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></label>
              </div>
              <label>Venue <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-button" type="submit">Save</button>
                <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
