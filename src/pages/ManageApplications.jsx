import { CheckCircle2, CircleSlash, FileCheck2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api.js";

const actions = [
  ["approved", "Approve", CheckCircle2, "primary-button"],
  ["declined", "Decline", CircleSlash, "danger-button"],
  ["completed", "Complete", FileCheck2, "primary-button"],
];

export default function ManageApplications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
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

  // Completed applications can only be changed by an admin. Trainers see
  // read-only action buttons, while admins can still approve, decline, or
  // re-mark the application as completed.
  const isAdmin = user?.role === "saed_admin" || user?.role === "dunis_admin";

  function isActionDisabled(item, status) {
    if (item.status === status) return true;
    if (item.status === "completed" && !isAdmin) return true;
    return false;
  }

  async function updateStatus(id, status) {
    showMsg("");
    try {
      await api(`/manage/applications/${id}/`, { method: "PATCH", body: { status } });
      await load();
      showMsg("Application updated.", "success");
    } catch (err) {
      showMsg(err.message, "error");
    }
  }

  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>Application Management</h2>
          <p>Review submitted applications and move them through approval, decline, and completion.</p>
        </div>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}
      <div className="filter-row">
        <div className="filter-label">Filter:</div>
        <div className="filter-buttons">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button type="button" className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pending</button>
          <button type="button" className={filter === "approved" ? "active" : ""} onClick={() => setFilter("approved")}>Approved</button>
          <button type="button" className={filter === "declined" ? "active" : ""} onClick={() => setFilter("declined")}>Declined</button>
          <button type="button" className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>
        </div>
      </div>
      {loading ? <div className="empty-state">Loading applications...</div> : null}

      {!loading && !applications.length ? <div className="empty-state">No applications have been submitted yet.</div> : null}

      {!loading && applications.length ? (
        <div className="management-table">
          <div className="management-row table-head">
            <span>Applicant</span>
            <span>Program</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {(filter === "all" ? applications : applications.filter((a) => a.status === filter)).map((item) => (
            <div className="management-row" key={item.id}>
              <div>
                <strong>{item.applicant.fullName}</strong>
                <span>{item.applicant.email}</span>
              </div>
              <div>
                <strong>{item.program.title}</strong>
                <span>{item.program.location}</span>
              </div>
              <span className={`status-pill status-${item.status}`}>{item.status}</span>
              <div className="row-actions">
                {actions.map(([status, label, Icon, btnClass]) => (
                  <button
                    className={btnClass}
                    disabled={isActionDisabled(item, status)}
                    key={status}
                    onClick={() => updateStatus(item.id, status)}
                    title={label}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
