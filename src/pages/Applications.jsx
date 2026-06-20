import { Clock3, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const canManage = ["saed_admin", "dunis_admin", "trainer"].includes(user?.role);

  useEffect(() => {
    setLoading(true);
    api(canManage ? "/manage/applications/" : "/applications/")
      .then((data) => {
        const sorted = [...(data.applications || [])].sort((first, second) => {
          const firstProgram = first.program.title.localeCompare(second.program.title);
          if (firstProgram !== 0) return firstProgram;
          return first.applicant.fullName.localeCompare(second.applicant.fullName);
        });
        setApplications(sorted);
      })
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [canManage, navigate]);

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  const groupedApplications = applications.reduce((groups, item) => {
    const key = item.program.title;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>{canManage ? "Student Applications" : "My Applications"}</h2>
          <p>{canManage ? "Check submitted student applications sorted by program." : "Track the SAED programs you have applied for."}</p>
        </div>
        {!canManage ? <Link to="/app/programs">Browse programs</Link> : null}
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}
      {loading ? <div className="empty-state">Checking your applications...</div> : null}

      {!loading && !applications.length ? (
        <div className="empty-state">
          <FileText size={22} />
          <p>{canManage ? "No student applications have been submitted yet." : "You have not submitted any applications yet."}</p>
          {!canManage ? <Link className="primary-button" to="/app/programs">Choose a Program</Link> : null}
        </div>
      ) : null}

      {!loading && canManage && applications.length ? (
        <div className="student-application-groups">
          {Object.entries(groupedApplications).map(([programTitle, items]) => (
            <section className="student-application-group" key={programTitle}>
              <div className="group-heading">
                <h3>{programTitle}</h3>
                <span>{items.length} application{items.length === 1 ? "" : "s"}</span>
              </div>
              <div className="management-table">
                <div className="management-row student-application-row table-head">
                  <span>Applicant</span>
                  <span>Status</span>
                  <span>Applied</span>
                  <span>Location</span>
                </div>
                {items.map((item) => (
                  <div className="management-row student-application-row" key={item.id}>
                    <div>
                      <strong>{item.applicant.fullName}</strong>
                      <span>{item.applicant.email}</span>
                    </div>
                    <span className={`status-pill status-${item.status}`}>{item.status}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>{item.program.location}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {!loading && !canManage && applications.length ? (
        <div className="application-grid">
          {applications.map((item) => (
            <article className="application-card" key={item.id}>
              <div>
                <span className={`status-pill status-${item.status}`}>{item.status}</span>
                <h3>{item.program.title}</h3>
                <p>{item.program.description}</p>
              </div>
              <dl>
                <div><dt>Applied</dt><dd>{new Date(item.createdAt).toLocaleDateString()}</dd></div>
                <div><dt>Duration</dt><dd>{item.program.durationWeeks} weeks</dd></div>
                <div><dt>Location</dt><dd>{item.program.location}</dd></div>
                <div><dt>Trainer</dt><dd>{item.program.trainerName}</dd></div>
              </dl>
              <div className="application-note">
                <Clock3 size={16} />
                <span>{item.status === "pending" ? "Awaiting trainer review" : "Status updated by SAED"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
