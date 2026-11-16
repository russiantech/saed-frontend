import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";

export default function ManageApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  async function load() {
    const data = await api("/manage/applications/");
    setApplications(data.applications || []);
  }

  useEffect(() => {
    load()
      .catch((err) => {
        if (err.status === 401) navigate("/login", { replace: true });
        else showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const sorted = [...applications].sort((a, b) => {
    const aLast = (a.applicant.fullName || "").split(" ").slice(-1)[0].toLowerCase();
    const bLast = (b.applicant.fullName || "").split(" ").slice(-1)[0].toLowerCase();
    if (aLast !== bLast) return aLast.localeCompare(bLast);
    const aCourse = (a.program.title || "").toLowerCase();
    const bCourse = (b.program.title || "").toLowerCase();
    return aCourse.localeCompare(bCourse);
  });

  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>Enrollment Management</h2>
          <p>Students, their enrolled courses, and progress.</p>
        </div>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {loading ? <div className="empty-state">Loading enrollments...</div> : null}

      {!loading && !sorted.length ? (
        <div className="empty-state">
          <p>No enrollments yet.</p>
        </div>
      ) : null}

      {!loading && sorted.length ? (
        <div className="management-table enrollment-management">
          <div className="management-row table-head">
            <span>Student</span>
            <span>Course</span>
            <span>Progress</span>
          </div>
          {sorted.map((item) => (
            <div className="management-row" key={item.id}>
              <div>
                <strong>{item.applicant.fullName}</strong>
                <span>{item.applicant.email}</span>
              </div>
              <div>
                <strong>{item.program.title}</strong>
                <span>{item.program.location}</span>
              </div>
              <div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${item.progressPercentage || 0}%` }} />
                  </div>
                  <span className="progress-text">{item.completedLessons || 0}/{item.totalLessons || 0} lessons ({item.progressPercentage || 0}%)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
