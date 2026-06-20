import { Ban, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../lib/api.js";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
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
  }, []);

  async function toggleRestrict(course) {
    const action = course.isRestricted ? "unrestrict" : "restrict";
    if (!confirm(`Are you sure you want to ${action} this course?`)) return;
    try {
      await api(`/manage/courses/${course.id}/${action}/`, { method: "POST" });
      await load();
      showMsg(`Course ${action}ed successfully.`, "success");
    } catch (err) {
      showMsg(err.message || `Failed to ${action} course`, "error");
    }
  }

  if (loading) return <div className="page-container"><p>Loading courses...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/app" className="back-link">← Back to Dashboard</Link>
          <h1>All Courses</h1>
          <p>Manage and restrict trainer courses.</p>
        </div>
      </div>

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
              <span>₦{course.price}</span>
              <span>{course.durationWeeks} weeks</span>
              {course.hasFastTrack && <span className="fast-track-badge">Fast Track</span>}
            </div>
            <div className="course-actions">
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
