import { Ban, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/api.js";
import ConfirmModal from "../../components/ui/ConfirmModal.jsx";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  function openConfirm(title, message, onConfirm, destructive = false) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmDestructive(destructive);
    setConfirmAction(() => onConfirm);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (confirmAction) confirmAction();
    setConfirmOpen(false);
    setConfirmAction(null);
  }

  async function load() {
    try {
      const data = await api("/admin/courses/");
      setCourses(data.courses || []);
    } catch (err) {
      showMsg(err.message || "Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  async function toggleRestrict(course) {
    const action = course.isRestricted ? "unrestrict" : "restrict";
    openConfirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Course`,
      `Are you sure you want to ${action} this course?`,
      async () => {
        try {
          await api(`/manage/courses/${course.id}/${action}/`, { method: "POST" });
          await load();
          showMsg(`Course ${action}ed successfully.`, "success");
        } catch (err) {
          showMsg(err.message || `Failed to ${action} course`, "error");
        }
      },
      action === "restrict"
    );
  }

  if (loading) return <div className="page-container"><p>Loading courses...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/app" className="back-link">&larr; Back to Dashboard</Link>
          <h1>All Courses</h1>
          <p>Manage and restrict trainer courses.</p>
        </div>
      </div>

      <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} destructive={confirmDestructive} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} />

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => setMessage("")}>×</button>
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
              <span>{course.courseType === "in_camp" ? "In-Camp" : "Post-Camp"}</span>
              <span>{course.lessonCount} lessons · {course.enrolledCount} enrolled</span>
              {!course.isPublished && <span className="status-badge inactive">Draft</span>}
            </div>
            <div className="course-actions">
              <Link className="outline-button" to={`/app/courses/${course.id}`}>View</Link>
              <button className="outline-button" onClick={() => toggleRestrict(course)} type="button">
                {course.isRestricted ? <ShieldAlert size={16} /> : <Ban size={16} />}
                {course.isRestricted ? "Unrestrict" : "Restrict"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="empty-state">
          <p>No courses found.</p>
        </div>
      )}
    </div>
  );
}
