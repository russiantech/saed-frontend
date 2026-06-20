import { BookOpen, ChevronLeft, UserPlus, CheckCircle, Mail, MapPin, Briefcase, Award, CreditCard, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function ConnectTrainer() {
  const { trainerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [courses, setCourses] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [payingCourseId, setPayingCourseId] = useState(null);
  const [payRef, setPayRef] = useState(null);
  const [payAmount, setPayAmount] = useState(null);
  const [payCourseTitle, setPayCourseTitle] = useState("");
  const [verifying, setVerifying] = useState(false);

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    async function loadTrainer() {
      try {
        const data = await api(`/trainers/${trainerId}/`);
        setTrainer(data.trainer);
        setCourses(data.courses || []);
        setConnectionStatus(data.connectionStatus);
      } catch (err) {
        showMsg("Failed to load trainer details.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadTrainer();
  }, [trainerId]);

  async function handleConnect() {
    setConnecting(true);
    showMsg("");
    try {
      await api("/connect/", { method: "POST", body: { trainerId: parseInt(trainerId) } });
      setConnectionStatus("pending");
    } catch (err) {
      showMsg(err.message || "Failed to send connection request.", "error");
    } finally {
      setConnecting(false);
    }
  }

  async function handlePay(course) {
    setPayingCourseId(course.id);
    showMsg("");
    try {
      const data = await api("/courses/pay/", {
        method: "POST",
        body: { courseId: course.id },
      });
      setPayRef(data.reference);
      setPayAmount(data.amount);
      setPayCourseTitle(data.courseTitle);
    } catch (err) {
      showMsg(err.message || "Failed to initialize payment.", "error");
      setPayingCourseId(null);
    }
  }

  async function handleVerifyPayment() {
    if (!payRef) return;
    setVerifying(true);
    showMsg("");
    try {
      await api("/courses/pay/verify/", {
        method: "POST",
        body: { reference: payRef },
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === payingCourseId ? { ...c, isPaid: true, isEnrolled: true } : c
        )
      );
      setPayRef(null);
      setPayingCourseId(null);
      showMsg("Payment confirmed. You now have access to this course.", "success");
    } catch (err) {
      showMsg(err.message || "Failed to verify payment.", "error");
    } finally {
      setVerifying(false);
    }
  }

  function cancelPayment() {
    setPayRef(null);
    setPayingCourseId(null);
    setPayAmount(null);
    setPayCourseTitle("");
  }

  if (loading) return <div className="page-container"><p>Loading trainer profile...</p></div>;
  if (!trainer) return <div className="page-container"><p>Trainer not found.</p><Link to="/app/find-trainers"><ChevronLeft size={16} /> Back to search</Link></div>;

  return (
    <div className="page-container">
      <Link to="/app/find-trainers" className="back-link"><ChevronLeft size={16} /> Back to Trainers</Link>

      <div className="trainer-profile">
        <div className="trainer-profile-header">
          <div className="trainer-avatar-lg">
            {trainer.profilePicture ? (
              <img src={trainer.profilePicture} alt={trainer.fullName} />
            ) : (
              trainer.fullName?.charAt(0)
            )}
          </div>
          <div className="trainer-profile-info">
            <h1>{trainer.fullName}</h1>
            <p className="trainer-spec">{trainer.specialization}</p>
            {trainer.companyName && <p className="trainer-company"><Briefcase size={14} /> {trainer.companyName}</p>}
          </div>
        </div>

        <div className="trainer-profile-stats">
          <div className="stat-item"><Award size={16} /><span>{trainer.yearsExperience} years experience</span></div>
          <div className="stat-item"><UserPlus size={16} /><span>{trainer.numberTrained} corps members trained</span></div>
          {trainer.partnerLgas?.length > 0 && (
            <div className="stat-item"><MapPin size={16} /><span>Covers {trainer.partnerLgas.length} LGA{trainer.partnerLgas.length > 1 ? "s" : ""}</span></div>
          )}
        </div>

        {trainer.bio && (
          <div className="trainer-profile-section">
            <h3>About</h3>
            <p>{trainer.bio}</p>
          </div>
        )}

        {trainer.partnerLgas?.length > 0 && (
          <div className="trainer-profile-section">
            <h3>Partner LGAs</h3>
            <div className="lga-tags">
              {trainer.partnerLgas.map((lga) => (
                <span key={lga} className="lga-tag">{lga}</span>
              ))}
            </div>
          </div>
        )}

        <div className="trainer-profile-section">
          <h3><Mail size={16} /> Contact</h3>
          <p>{trainer.email}</p>
        </div>

        {connectionStatus === null ? (
          <button className="primary-button connect-button" onClick={handleConnect} disabled={connecting}>
            <UserPlus size={16} /> {connecting ? "Sending Request..." : "Connect with Trainer"}
          </button>
        ) : connectionStatus === "pending" ? (
          <div className="connection-status pending">
            <span className="status-pill status-pending">Connection Request Pending</span>
            <p>Your request has been sent. The trainer will review and approve it.</p>
          </div>
        ) : connectionStatus === "active" ? (
          <div className="connection-status active">
            <span className="status-pill status-approved"><CheckCircle size={14} /> Connected</span>
            <p>You are connected with this trainer.</p>
          </div>
        ) : null}

        {error && (
          <div className={`inline-message inline-message--${messageType || "error"}`} style={{ marginTop: 12 }}>
            {error}
            <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
          </div>
        )}
      </div>

      {courses.length > 0 && (
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="panel-heading">
            <h2><BookOpen size={18} /> Courses by {trainer.fullName}</h2>
          </div>
          <div className="program-list">
            {courses.map((course) => {
              const price = Number(course.price);
              const isFree = price === 0;
              const isPaid = course.isPaid;
              return (
                <article key={course.id} className="program-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{course.title}</strong>
                    <span>{course.category} · {course.durationWeeks} weeks · {course.hasFastTrack ? "Fast Track" : "Standard"}</span>
                    {course.startDate && <span>Starts {new Date(course.startDate).toLocaleDateString()}</span>}
                  </div>
                  <div className="course-actions" style={{ flexShrink: 0 }}>
                    {isFree ? (
                      <span className="status-pill status-approved">Free</span>
                    ) : isPaid ? (
                      <span className="status-pill status-approved"><CheckCircle size={14} /> Paid</span>
                    ) : payingCourseId === course.id && payRef ? (
                      <div className="course-pay-flow">
                        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>
                          Pay <strong>₦{payAmount}</strong> for <strong>{payCourseTitle}</strong>
                        </p>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>
                          Reference: <code>{payRef}</code>
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="primary-button"
                            style={{ minHeight: 36, padding: "0 16px", fontSize: 13 }}
                            disabled={verifying}
                            onClick={handleVerifyPayment}
                            type="button"
                          >
                            <CheckCircle size={14} /> {verifying ? "Verifying..." : "I've Paid"}
                          </button>
                          <button
                            className="outline-button"
                            style={{ minHeight: 36, padding: "0 16px", fontSize: 13 }}
                            onClick={cancelPayment}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="primary-button"
                        style={{ minHeight: 36, padding: "0 16px", fontSize: 13 }}
                        onClick={() => handlePay(course)}
                        disabled={payingCourseId === course.id}
                        type="button"
                      >
                        <CreditCard size={14} /> Pay ₦{price}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
