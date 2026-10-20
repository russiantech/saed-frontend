import { Clock3, FileText, X, AlertCircle, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [refundModalItem, setRefundModalItem] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
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
        setEnrollments(sorted);
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

  async function handleRefundSubmit(e) {
    e.preventDefault();
    if (!refundReason.trim()) {
      showMsg("Please provide a reason for the refund request.", "error");
      return;
    }
    setSubmittingRefund(true);
    try {
      await api(`/courses/${refundModalItem.program.id}/request-refund/`, {
        method: "POST",
        body: { reason: refundReason.trim() },
      });
      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === refundModalItem.id
            ? { ...item, refundRequested: true, refundProcessed: false }
            : item
        )
      );
      showMsg("Your refund request has been submitted for administrative review.", "success");
      setRefundModalItem(null);
      setRefundReason("");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setSubmittingRefund(false);
    }
  }

  const groupedEnrollments = enrollments.reduce((groups, item) => {
    const key = item.program.title;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div>
          <h2>{canManage ? "Student Enrollments" : "My Enrollments"}</h2>
          <p>{canManage ? "Check submitted student enrollments sorted by course." : "Track the SAED courses you have enrolled in."}</p>
        </div>
        {!canManage ? <Link to="/app/programs">Browse courses</Link> : null}
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}
      {loading ? <div className="empty-state">Checking your enrollments...</div> : null}

      {!loading && !enrollments.length ? (
        <div className="empty-state">
          <FileText size={22} />
          <p>{canManage ? "No student enrollments have been submitted yet." : "You have not enrolled in any courses yet."}</p>
          {!canManage ? <Link className="primary-button" to="/app/programs">Choose a Course</Link> : null}
        </div>
      ) : null}

      {!loading && canManage && enrollments.length ? (
        <div className="student-application-groups">
          {Object.entries(groupedEnrollments).map(([programTitle, items]) => (
            <section className="student-application-group" key={programTitle}>
              <div className="group-heading">
                <h3>{programTitle}</h3>
                <span>{items.length} enrollment{items.length === 1 ? "" : "s"}</span>
              </div>
              <div className="management-table">
                <div className="management-row student-application-row table-head">
                  <span>Student</span>
                  <span>Status</span>
                  <span>Enrolled</span>
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

      {!loading && !canManage && enrollments.length ? (
        <div className="application-grid">
          {enrollments.map((item) => (
            <article className="application-card" key={item.id}>
              <div>
                <span className={`status-pill status-${item.status}`}>{item.status}</span>
                <h3>{item.program.title}</h3>
                <p>{item.program.description}</p>
              </div>
              <dl>
                <div><dt>Enrolled</dt><dd>{new Date(item.createdAt).toLocaleDateString()}</dd></div>
                <div><dt>Duration</dt><dd>{item.program.durationWeeks} weeks</dd></div>
                <div><dt>Location</dt><dd>{item.program.location}</dd></div>
                <div><dt>Trainer</dt><dd>{item.program.trainerName}</dd></div>
              </dl>
              <div className="application-note">
                <Clock3 size={16} />
                <span>{item.status === "pending" ? "Awaiting trainer review" : item.status === "confirmed" ? "Enrolled & Active" : "Status updated by SAED"}</span>
              </div>
              {item.status === "confirmed" && !item.refundRequested && (
                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color, #e0e6e2)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link to={`/app/courses/${item.program.id}`} className="primary-button" style={{ fontSize: "12px", padding: "6px 12px" }}>
                    View Course
                  </Link>
                  <button
                    type="button"
                    className="outline-button"
                    style={{ fontSize: "12px", padding: "6px 10px", color: "var(--danger, #d32f2f)", borderColor: "var(--danger, #d32f2f)" }}
                    onClick={() => {
                      setRefundModalItem(item);
                      setRefundReason("");
                    }}
                  >
                    <RotateCcw size={13} style={{ marginRight: 4 }} /> Request Refund
                  </button>
                </div>
              )}
              {item.refundRequested && !item.refundProcessed && (
                <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(234, 179, 8, 0.12)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "6px", fontSize: "12px", color: "#854d0e" }}>
                  <strong>Refund Pending Review:</strong> Your refund request is currently awaiting NYSC SAED administrative decision.
                </div>
              )}
              {item.status === "refunded" && (
                <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
                  <strong>Refunded:</strong> Course access closed. {item.refundNote ? `(${item.refundNote})` : ""}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {refundModalItem && (
        <div className="modal-backdrop" onClick={() => setRefundModalItem(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-heading">
              <div>
                <span className="status-pill status-pending">Refund Request</span>
                <h3>Request Course Refund</h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setRefundModalItem(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRefundSubmit}>
              <p>
                You are requesting a refund for <strong>{refundModalItem.program.title}</strong>. Please provide a clear explanation for your request. An administrator will review your application.
              </p>
              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="refund-reason" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Reason for Refund Request
                </label>
                <textarea
                  id="refund-reason"
                  rows={4}
                  required
                  placeholder="Explain why you are requesting a refund (e.g., schedule conflict, relocated LGA, trainer unreachable)..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--surface-border)", background: "var(--surface)", color: "var(--text)", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setRefundModalItem(null)}
                  disabled={submittingRefund}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ backgroundColor: "#d32f2f", borderColor: "#d32f2f", color: "#fff" }}
                  disabled={submittingRefund}
                >
                  {submittingRefund ? "Submitting..." : "Submit Refund Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
