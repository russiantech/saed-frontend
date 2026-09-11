import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/api.js";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/my-courses/");
        setCourses(data.courses || []);
      } catch (err) {
        showMsg(err.message || "Failed to load courses", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-container"><p>Loading courses...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Courses</h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 14 }}>
            Courses you are enrolled in across all connected trainers.
          </p>
        </div>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType}`} style={{ marginBottom: 16 }}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}>
            ×
          </button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} style={{ color: "var(--muted)", opacity: 0.5 }} />
          <p>You are not enrolled in any courses yet.</p>
          <Link to="/app/my-trainers" className="primary-button" style={{ marginTop: 12 }}>
            Browse Trainers
          </Link>
        </div>
      ) : (
        <div className="program-list">
          {courses.map((course) => (
            <article key={course.id} className="program-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{course.title}</strong>
                <span>{course.category} · {course.durationWeeks} weeks · {course.hasFastTrack ? "Fast Track" : "Standard"}</span>
                <span>Trainer: {course.trainerName}</span>
                {course.startDate && <span>Starts {new Date(course.startDate).toLocaleDateString()}</span>}
              </div>
              <div className="course-actions" style={{ flexShrink: 0 }}>
                {course.enrollmentStatus === "confirmed" ? (
                  <span className="status-pill status-approved"><CheckCircle size={14} /> Enrolled</span>
                ) : course.enrollmentStatus === "pending" ? (
                  <span className="status-pill status-pending"><Clock size={14} /> Pending</span>
                ) : course.enrollmentStatus === "rejected" ? (
                  <span className="status-pill status-declined">Rejected</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
