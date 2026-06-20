import { Video, Plus, Trash2, Edit, X, ArrowLeft, BookOpen, Clock, Play, Check, Ban, CreditCard, Users } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

import { api } from "../lib/api.js";

function getVideoThumbnail(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

export default function FastTrackVideos() {
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", videoUrl: "", durationSeconds: 0, order: 0, price: 0, isFreePreview: false });
  const durationTimer = useRef(null);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  async function load() {
    try {
      const [vidResult, courseResult] = await Promise.allSettled([
        api("/manage/fast-track-videos/"),
        api("/manage/courses/"),
      ]);
      if (vidResult.status === "fulfilled") {
        setVideos(vidResult.value.videos || []);
      } else if (vidResult.reason?.status === 403) {
        showMsg("You are not approved to upload fast track videos. Contact an admin.", "error");
      } else {
        showMsg(vidResult.reason?.message || "Failed to load videos.", "error");
      }
      if (courseResult.status === "fulfilled") {
        setCourses((courseResult.value.courses || []).filter((c) => c.hasFastTrack));
      }
    } catch (err) {
      showMsg(err.message || "Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadPending() {
    setLoadingPending(true);
    try {
      const data = await api("/trainer/enrollments/pending/");
      setPendingEnrollments(data.enrollments || []);
    } catch (err) {
      showMsg(err.message || "Failed to load pending enrollments.", "error");
    } finally {
      setLoadingPending(false);
    }
  }

  useEffect(() => { load(); loadPending(); }, []);

  async function handleConfirm(enrollmentId) {
    try {
      await api(`/trainer/enrollments/${enrollmentId}/confirm/`, { method: "POST" });
      setPendingEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      showMsg("Enrollment confirmed.", "success");
    } catch (err) {
      showMsg(err.message || "Failed to confirm.", "error");
    }
  }

  async function handleReject(enrollmentId) {
    if (!window.confirm("Reject this payment? The student will be notified.")) return;
    try {
      await api(`/trainer/enrollments/${enrollmentId}/reject/`, { method: "POST" });
      setPendingEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      showMsg("Enrollment rejected.", "success");
    } catch (err) {
      showMsg(err.message || "Failed to reject.", "error");
    }
  }

  const fetchDuration = useCallback(async (url) => {
    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("vimeo.com"))) {
      return;
    }
    try {
      const data = await api("/manage/fetch-video-duration/", { method: "POST", body: { url } });
      setForm((prev) => ({ ...prev, durationSeconds: data.durationSeconds }));
    } catch {
    }
  }, []);

  function handleUrlChange(value) {
    setForm((prev) => ({ ...prev, videoUrl: value }));
    if (durationTimer.current) clearTimeout(durationTimer.current);
    durationTimer.current = setTimeout(() => fetchDuration(value), 800);
  }

  useEffect(() => () => { if (durationTimer.current) clearTimeout(durationTimer.current); }, []);

  function openForm(video, course) {
    if (video) {
      setEditingId(video.id);
      setForm({
        courseId: video.courseId,
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        durationSeconds: video.durationSeconds,
        order: video.order,
        price: video.price,
        isFreePreview: video.isFreePreview,
      });
    } else {
      setEditingId(null);
      setForm({ courseId: course?.id || "", title: "", description: "", videoUrl: "", durationSeconds: 0, order: videos.filter((v) => v.courseId === (course?.id || "")).length + 1, price: 0, isFreePreview: false });
    }
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api(`/manage/fast-track-videos/${editingId}/`, { method: "PATCH", body: form });
      } else {
        await api("/manage/fast-track-videos/", { method: "POST", body: form });
      }
      setShowForm(false);
      load();
    } catch (err) {
      showMsg(err.message || "Failed to save video.", "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this video?")) return;
    try {
      await api(`/manage/fast-track-videos/${id}/`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      showMsg(err.message || "Failed to delete video.", "error");
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  if (loading) return <div className="empty-state">Loading fast track courses...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Video size={24} /> Fast Track Courses</h1>
          <p>Manage your fast track videos and course enrollments</p>
        </div>
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          className={activeTab === "courses" ? "primary-button" : "secondary-button"}
          onClick={() => setActiveTab("courses")}
        >
          <BookOpen size={14} /> My Courses
        </button>
        <button
          type="button"
          className={activeTab === "payments" ? "primary-button" : "secondary-button"}
          onClick={() => { setActiveTab("payments"); loadPending(); }}
        >
          <CreditCard size={14} /> Pending Payments
          {pendingEnrollments.length > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
              {pendingEnrollments.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "payments" ? (
        <div>
          {loadingPending ? (
            <div className="empty-state">Loading pending payments...</div>
          ) : pendingEnrollments.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} style={{ opacity: 0.3 }} />
              <p>No pending course payments.</p>
            </div>
          ) : (
            <div className="trainer-list">
              {pendingEnrollments.map((e) => (
                <div key={e.id} className="corper-record" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{e.studentName}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>{e.studentEmail}</div>
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <strong>{e.courseTitle}</strong> &mdash; ₦{e.amount}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                        Ref: {e.paymentReference}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="primary-button"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", fontSize: 13 }}
                        onClick={() => handleConfirm(e.id)}
                      >
                        <Check size={14} /> Confirm
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", fontSize: 13, color: "#ef4444", borderColor: "#ef4444" }}
                        onClick={() => handleReject(e.id)}
                      >
                        <Ban size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : showForm ? (
        <div>
          <button className="back-link" onClick={() => setShowForm(false)} type="button">
            <ArrowLeft size={16} /> Back to courses
          </button>
          <div className="form-card">
            <h2>{editingId ? "Edit Video" : "Add Video"}</h2>
            <form className="management-form" onSubmit={handleSubmit}>
              <label>Course
                <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label>Title
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label>Description
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </label>
              <label>Video URL
                <input value={form.videoUrl} onChange={(e) => handleUrlChange(e.target.value)} required placeholder="YouTube or Vimeo URL" />
              </label>
              <label>Duration (seconds)
                <input type="number" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })} />
              </label>
              <label>Order
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} min="1" />
              </label>
              <label>Price (₦)
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min="0" step="100" />
              </label>
              <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={form.isFreePreview} onChange={(e) => setForm({ ...form, isFreePreview: e.target.checked })} />
                <span className="checkbox-custom" />
                Free Preview
              </label>
              <button className="primary-button" type="submit" style={{ marginTop: 8 }}>{editingId ? "Update" : "Add"} Video</button>
            </form>
          </div>
        </div>
      ) : selectedCourse ? (
        <div>
          <button className="back-link" onClick={() => setSelectedCourse(null)} type="button">
            <ArrowLeft size={16} /> Back to courses
          </button>

          <div className="ft-course-intro">
            <h2>{selectedCourse.title}</h2>
            {selectedCourse.description && <p className="ft-course-desc">{selectedCourse.description}</p>}
            <div className="ft-course-meta">
              {selectedCourse.category && <span className="ft-badge ft-badge-cat">{selectedCourse.category}</span>}
            </div>
          </div>

          <button className="primary-button" onClick={() => openForm(null, selectedCourse)} style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Add Video
          </button>

          {(() => {
            const courseVideos = videos.filter((v) => v.courseId === selectedCourse.id).sort((a, b) => a.order - b.order);
            return courseVideos.length === 0 ? (
              <div className="empty-state"><p>No videos yet. Add your first fast track video.</p></div>
            ) : (
              <div className="ft-video-list">
                {courseVideos.map((v) => {
                  const thumb = getVideoThumbnail(v.videoUrl);
                  return (
                    <div key={v.id} className="ft-video-card">
                      {thumb ? (
                        <div className="ft-video-thumb">
                          <img src={thumb} alt={v.title} />
                          <div className="ft-video-thumb-overlay">
                            <Play size={20} fill="#fff" color="#fff" />
                          </div>
                        </div>
                      ) : (
                        <div className="ft-video-number">{v.order}</div>
                      )}
                      <div className="ft-video-info">
                        <strong>{v.title}</strong>
                        {v.description && <p>{v.description}</p>}
                        <div className="ft-video-meta">
                          <span><Clock size={13} /> {formatDuration(v.durationSeconds)}</span>
                          {v.isFreePreview ? (
                            <span className="ft-badge ft-badge-free">Free Preview</span>
                          ) : (
                            <span className="ft-badge ft-badge-paid">₦{v.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="trainer-row-actions">
                        <button className="icon-action" onClick={() => openForm(v)}><Edit size={16} /></button>
                        <button className="icon-action danger" onClick={() => handleDelete(v.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} style={{ opacity: 0.3 }} />
          <p>No courses with fast track enabled. Enable fast track on a course to add videos.</p>
        </div>
      ) : (
        <div className="ft-courses-grid">
          {courses.map((course) => {
            const count = videos.filter((v) => v.courseId === course.id).length;
            return (
              <div key={course.id} className="ft-course-card" onClick={() => setSelectedCourse(course)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelectedCourse(course)}>
                <div className="ft-course-card-header">
                  <div className="ft-course-card-icon">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3>{course.title}</h3>
                  </div>
                </div>
                {course.description && <p className="ft-course-card-desc">{course.description}</p>}
                <div className="ft-course-card-footer">
                  <span className="ft-badge ft-badge-free">{count} video{count !== 1 ? "s" : ""}</span>
                  <span className="ft-view-link">Manage Videos <Play size={12} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
