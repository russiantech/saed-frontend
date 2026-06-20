import { UserCheck, ArrowLeft, CheckCircle, XCircle, BookOpen, X, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";

export default function CorperProfile() {
  const { corperId } = useParams();
  const navigate = useNavigate();
  const [corper, setCorper] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [actionId, setActionId] = useState(null);

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    api(`/trainer/corpers/${corperId}/`)
      .then((d) => {
        setCorper(d.corper);
        setCourses(d.courses || []);
      })
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [corperId, navigate]);

  async function handleApprove() {
    if (!corper?.connectionId) return;
    setActionId(corper.connectionId);
    try {
      await api(`/connections/${corper.connectionId}/approve/`, { method: "POST" });
      setCorper((prev) => ({ ...prev, connectionStatus: "active" }));
      showMsg("Connection approved.", "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject() {
    if (!corper?.connectionId) return;
    setActionId(corper.connectionId);
    try {
      await api(`/connections/${corper.connectionId}/reject/`, { method: "POST" });
      setCorper((prev) => ({ ...prev, connectionStatus: "cancelled" }));
      showMsg("Connection declined.", "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleEnrollmentAction(enrollmentId, action) {
    setActionId(enrollmentId);
    try {
      await api(`/trainer/enrollments/${enrollmentId}/${action}/`, { method: "POST" });
      setCourses((prev) =>
        prev.map((c) =>
          c.enrollmentId === enrollmentId
            ? { ...c, enrollmentStatus: action === "confirm" ? "confirmed" : "rejected" }
            : c
        )
      );
      showMsg(`Enrollment ${action === "confirm" ? "confirmed" : "rejected"}.`, "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="empty-state">Loading corper profile...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <button className="back-link" onClick={() => navigate("/app/my-corpers")} type="button">
            <ArrowLeft size={16} /> Back to My Corpers
          </button>
          <h1><UserCheck size={24} /> Corper Profile</h1>
        </div>
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {corper && (
        <div className="corper-profile-card">
          <div className="corper-profile-header">
            <div className="trainer-avatar-inline large">{corper.fullName?.charAt(0)}</div>
            <div>
              <h2>{corper.fullName}</h2>
              <p>{corper.email}</p>
            </div>
          </div>
          <div className="corper-profile-details">
            <div className="view-field"><span>Phone</span><strong>{corper.phone || "—"}</strong></div>
            <div className="view-field"><span>LGA of Deployment</span><strong>{corper.lgaOfDeployment || "—"}</strong></div>
            <div className="view-field"><span>Skill Interest</span><strong>{corper.skillInterest || "—"}</strong></div>
            <div className="view-field"><span>State Code</span><strong>{corper.nyscStateCode || "—"}</strong></div>
            <div className="view-field"><span>Connection Status</span>
              <span className={`status-pill status-${corper.connectionStatus === "active" ? "approved" : corper.connectionStatus === "pending" ? "pending" : "declined"}`}>
                {corper.connectionStatus}
              </span>
            </div>
          </div>
          {corper.connectionStatus === "pending" && (
            <div className="corper-profile-actions">
              <button className="primary-button" disabled={actionId === corper.connectionId} onClick={handleApprove} type="button">
                <CheckCircle size={16} /> Approve
              </button>
              <button className="danger-button" disabled={actionId === corper.connectionId} onClick={handleReject} type="button">
                <XCircle size={16} /> Decline
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h2><BookOpen size={18} /> Your Courses</h2>
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>Courses this corps member can access through your training</p>
        {courses.length === 0 ? (
          <div className="empty-state"><p>No courses available.</p></div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => {
              const enrollmentLabel = course.isEnrolled
                ? course.isPaid
                  ? "Paid & Enrolled"
                  : course.enrollmentStatus === "pending"
                    ? "Awaiting Confirmation"
                    : course.enrollmentStatus === "confirmed"
                      ? "Confirmed"
                      : "Enrolled"
                : "Not Enrolled";
              const enrollmentClass = course.isEnrolled
                ? course.isPaid || course.enrollmentStatus === "confirmed"
                  ? "status-approved"
                  : course.enrollmentStatus === "pending"
                    ? "status-pending"
                    : "status-declined"
                : "";
              const pendingEnrollment = course.isEnrolled && course.enrollmentStatus === "pending" && course.enrollmentId;
              return (
                <div key={course.id} className="course-card">
                  <h3>{course.title}</h3>
                  <div className="course-tags">
                    <span className={`status-badge ${course.isActive ? "active" : "inactive"}`}>
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                    <span>₦{course.price}</span>
                    <span>{course.durationWeeks} weeks</span>
                    {course.isFull && <span className="status-pill status-declined">Full ({course.enrolledCount}/{course.maxStudents})</span>}
                    {course.hasFastTrack && <span className="fast-track-badge">Fast Track</span>}
                  </div>
                  {course.isEnrolled && (
                    <div style={{ marginTop: 10 }}>
                      <span className={`status-pill ${enrollmentClass}`}>
                        <CreditCard size={14} /> {enrollmentLabel}
                      </span>
                    </div>
                  )}
                  {pendingEnrollment && (
                    <div className="course-actions" style={{ marginTop: 10 }}>
                      <button
                        className="primary-button"
                        style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                        disabled={actionId === pendingEnrollment}
                        onClick={() => handleEnrollmentAction(pendingEnrollment, "confirm")}
                        type="button"
                      >
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button
                        className="danger-button"
                        style={{ minHeight: 34, padding: "0 14px", fontSize: 13 }}
                        disabled={actionId === pendingEnrollment}
                        onClick={() => handleEnrollmentAction(pendingEnrollment, "reject")}
                        type="button"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
