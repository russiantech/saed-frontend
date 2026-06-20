import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, X, CreditCard } from "lucide-react";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function CourseManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    durationWeeks: "4",
    startDate: "",
    endDate: "",
    maxStudents: "40",
    hasFastTrack: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("courses");
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const data = await api("/manage/courses/");
      setCourses(data.courses || []);
    } catch (err) {
      console.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  async function loadEnrollments() {
    setLoadingEnrollments(true);
    try {
      const data = await api("/trainer/enrollments/pending/");
      setEnrollments(data.enrollments || []);
    } catch (err) {
      showMsg(err.message || "Failed to load enrollments.", "error");
    } finally {
      setLoadingEnrollments(false);
    }
  }

  useEffect(() => {
    if (tab === "enrollments") loadEnrollments();
  }, [tab]);

  async function handleEnrollmentAction(id, action) {
    setActionId(id);
    showMsg("");
    try {
      await api(`/trainer/enrollments/${id}/${action}/`, { method: "POST" });
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      showMsg(`Enrollment ${action === "confirm" ? "confirmed" : "rejected"}.`, "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  function startCreate() {
    setEditingCourse(null);
    setForm({
      title: "", description: "", category: "", price: "",
      durationWeeks: "4", startDate: "", endDate: "",
      maxStudents: "40", hasFastTrack: false,
    });
    setShowForm(true);
  }

  function startEdit(course) {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      durationWeeks: String(course.durationWeeks),
      startDate: course.startDate || "",
      endDate: course.endDate || "",
      maxStudents: String(course.maxStudents),
      hasFastTrack: course.hasFastTrack,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        durationWeeks: parseInt(form.durationWeeks) || 4,
        maxStudents: parseInt(form.maxStudents) || 40,
      };
      if (editingCourse) {
        await api(`/manage/courses/${editingCourse.id}/`, { method: "PATCH", body });
      } else {
        await api("/manage/courses/", { method: "POST", body });
      }
      setShowForm(false);
      loadCourses();
    } catch (err) {
      alert(err.message || "Failed to save course");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCourse(id) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await api(`/manage/courses/${id}/`, { method: "DELETE" });
      loadCourses();
    } catch (err) {
      alert("Failed to delete course");
    }
  }

  if (loading) return <div className="page-container"><p>Loading courses...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/app" className="back-link">← Back to Dashboard</Link>
          <h1>My Courses</h1>
        </div>
        <button className="primary-button" onClick={startCreate}>+ Add Course</button>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      <div className="filter-tabs">
        <button className={`filter-tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")} type="button">
          My Courses ({courses.length})
        </button>
        <button className={`filter-tab ${tab === "enrollments" ? "active" : ""}`} onClick={() => setTab("enrollments")} type="button">
          Pending Enrollments ({enrollments.length})
        </button>
      </div>

      {tab === "courses" && (
        <>
          {showForm && (
            <div className="modal-overlay" onClick={() => setShowForm(false)}>
              <div className="modal-content modal-trainer-form" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{editingCourse ? "Edit Course" : "Create New Course"}</h2>
                  <p>{editingCourse ? "Update your course details" : "Add a new course to start teaching"}</p>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "block", padding: "24px 32px 28px" }}>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--heading)", margin: "0 0 14px", paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>Course Details</h3>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Course Title *</label>
                      <input style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} placeholder="e.g. Web Development Fundamentals" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Description</label>
                      <textarea style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)", resize: "vertical", minHeight: 80 }} placeholder="Brief description of the course content" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Skill Area / Category</label>
                      <select style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="">Select category</option>
                        {["Creative Industry", "Automobile", "Construction", "Agro-Allied", "Delivery & Logistics", "Culinary & Catering", "Cleaning Services", "Green Energy", "Satellite & Security Technology", "ICT", "Cosmetology", "Education"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--heading)", margin: "0 0 14px", paddingBottom: 8, borderBottom: "2px solid var(--border)" }}>Pricing &amp; Duration</h3>
                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Price (₦)</label>
                        <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min="0" step="0.01" />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Duration (weeks)</label>
                        <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.durationWeeks} onChange={(e) => setForm({ ...form, durationWeeks: e.target.value })} min="1" />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Start Date</label>
                        <input type="date" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>End Date</label>
                        <input type="date" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--heading)" }}>Max Students</label>
                      <input type="number" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg)", color: "var(--text)" }} value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} min="1" />
                    </div>
                  </div>
                  {user?.canUploadFastTrack && (
                    <div style={{ marginBottom: 24 }}>
                      <label className="checkbox-label">
                        <input type="checkbox" checked={form.hasFastTrack} onChange={(e) => setForm({ ...form, hasFastTrack: e.target.checked })} />
                        <span className="checkbox-custom" />
                        Enable Fast Track Course
                      </label>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="outline-button" onClick={() => setShowForm(false)}>Cancel</button>
                    <button className="primary-button" disabled={submitting}>{submitting ? "Saving..." : "Save Course"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className={`course-card ${course.isRestricted ? "restricted" : ""}`}>
                <h3>{course.title}</h3>
                <p className="course-meta">TRAINER: {course.trainerName}</p>
                <div className="course-tags">
                  <span className={`status-badge ${course.isActive ? "active" : "inactive"}`}>
                    {course.isActive ? "Active" : "Inactive"}
                  </span>
                  {course.isRestricted && <span className="status-badge restricted">Restricted</span>}
                  <span>₦{course.price}</span>
                  <span>{course.durationWeeks} weeks</span>
                  {course.hasFastTrack && <span className="fast-track-badge">Fast Track</span>}
                </div>
                <div className="course-actions">
                  <button className="outline-button" onClick={() => startEdit(course)}>Edit</button>
                  <button className="danger-button" onClick={() => deleteCourse(course.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="empty-state">
              <p>No courses yet. Create your first course to start teaching!</p>
            </div>
          )}
        </>
      )}

      {tab === "enrollments" && (
        <>
          {loadingEnrollments ? (
            <div className="empty-state">Loading pending enrollments...</div>
          ) : enrollments.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} style={{ opacity: 0.3 }} />
              <p>No pending enrollments. When students pay for your courses, their enrollments will appear here for your confirmation.</p>
            </div>
          ) : (
            <div className="management-table">
              <div className="management-row table-head">
                <span>Student</span>
                <span>Course</span>
                <span>Amount</span>
                <span>Reference</span>
                <span>Date</span>
                <span>Actions</span>
              </div>
              {enrollments.map((e) => (
                <div className="management-row" key={e.id}>
                  <div>
                    <strong>{e.studentName}</strong>
                    <span>{e.studentEmail}</span>
                  </div>
                  <div>
                    <strong>{e.courseTitle}</strong>
                  </div>
                  <span>₦{e.amount}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace" }}>{e.paymentReference}</span>
                  <span>{new Date(e.enrolledAt).toLocaleDateString()}</span>
                  <div className="action-buttons">
                    <button
                      className="primary-button"
                      style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                      disabled={actionId === e.id}
                      onClick={() => handleEnrollmentAction(e.id, "confirm")}
                      type="button"
                    >
                      <CheckCircle size={14} /> Confirm
                    </button>
                    <button
                      className="danger-button"
                      style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                      disabled={actionId === e.id}
                      onClick={() => handleEnrollmentAction(e.id, "reject")}
                      type="button"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
