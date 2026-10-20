import { ArrowLeft, Award, Printer, CheckCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

function categoryLabel(category) {
  return (category || "").replace(/_/g, " ");
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCertModal, setShowCertModal] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [certError, setCertError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/courses/${courseId}/`);
        setCourse(data.course);
        setTrainer(data.trainer);
        setEnrolledCount(data.enrolledCount || 0);

        if (user?.role === "corps_member") {
          try {
            const progData = await api(`/courses/${courseId}/progress/`);
            setProgress(progData);
          } catch {
            // Not enrolled or no progress yet
          }
        }
      } catch (err) {
        setError(err.message || "Course not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, user]);

  async function handleViewCertificate() {
    setLoadingCert(true);
    setCertError("");
    try {
      const data = await api(`/courses/${courseId}/certificate/`);
      setCertificate(data.certificate);
      setShowCertModal(true);
    } catch (err) {
      setCertError(err.message || "Failed to load certificate.");
    } finally {
      setLoadingCert(false);
    }
  }

  const backHref = user ? "/app/programs" : "/programs";

  if (loading) {
    return (
      <section className="course-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="screen-loader">Loading course...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="course-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="section-heading">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!course) return null;

  const slotsLeft = course.maxStudents - enrolledCount;

  return (
    <section className="course-detail-page">
      <Link className="back-link" to={backHref}>
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="course-detail-hero">
        <div className="course-detail-hero-body">
          <span className="category-label">{categoryLabel(course.category)}</span>
          <h1>{course.title}</h1>
          {course.description && (
            <div className="course-detail-description">
              {course.description.split("\n").map((line, index, arr) => (
                <span key={index}>
                  {line}
                  {index < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {certError && (
        <div className="inline-message inline-message--error" style={{ margin: "16px 0" }}>
          {certError}
          <button type="button" className="inline-message-close" onClick={() => setCertError("")}><X size={16} /></button>
        </div>
      )}

      {progress && progress.totalLessons > 0 && (
        <div className="course-progress-card" style={{
          marginTop: "20px",
          padding: "20px",
          background: "var(--surface)",
          border: "1px solid var(--surface-border)",
          borderRadius: "14px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Your Course Progress</h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                {progress.completedLessons} of {progress.totalLessons} lessons completed ({progress.percentage}%)
              </p>
            </div>
            {progress.isCompleted && (
              <button
                type="button"
                className="primary-button"
                onClick={handleViewCertificate}
                disabled={loadingCert}
                style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#15803d", borderColor: "#15803d" }}
              >
                <Award size={18} /> {loadingCert ? "Loading Certificate..." : "View Certificate"}
              </button>
            )}
          </div>
          <div style={{
            width: "100%",
            height: "10px",
            background: "var(--surface-soft, #e2e8f0)",
            borderRadius: "999px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${Math.min(progress.percentage, 100)}%`,
              height: "100%",
              background: progress.isCompleted ? "#15803d" : "var(--primary, #008751)",
              borderRadius: "999px",
              transition: "width 0.4s ease"
            }} />
          </div>
          {progress.isCompleted && (
            <div style={{
              marginTop: "14px",
              padding: "10px 14px",
              background: "rgba(21, 128, 61, 0.1)",
              border: "1px solid rgba(21, 128, 61, 0.25)",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <span>🎉 <strong>Congratulations!</strong> You have successfully finished all course modules. Your official NYSC SAED Certificate of Completion is available.</span>
              <button
                type="button"
                className="primary-button"
                onClick={handleViewCertificate}
                disabled={loadingCert}
                style={{ fontSize: "12px", padding: "6px 14px", backgroundColor: "#166534", borderColor: "#166534" }}
              >
                Claim Certificate
              </button>
            </div>
          )}
        </div>
      )}

      <dl className="course-detail-facts">
        <div>
          <dt>Trainer</dt>
          <dd>{trainer?.fullName || "—"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>Lagos</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{Number(course.price) === 0 ? "Free" : `₦${course.price}`}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{course.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{course.maxStudents}</dd>
        </div>
        <div>
          <dt>Slots Left</dt>
          <dd>{slotsLeft}</dd>
        </div>
      </dl>

      {course.startDate && (
        <div className="course-students">
          <header className="course-students-heading">
            <h4>Start Date</h4>
          </header>
          <ul className="course-students-list">
            <li className="course-student-item">
              <div className="course-student-name">{new Date(course.startDate).toLocaleDateString()}</div>
            </li>
          </ul>
        </div>
      )}

      {course.isRestricted && (
        <div className="inline-message inline-message--error" style={{ marginTop: 16 }}>
          This course is restricted. Only approved applicants can enroll.
        </div>
      )}

      {showCertModal && certificate && (
        <div className="certificate-modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="certificate-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className="certificate-modal-actions">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={20} color="#008751" />
                <strong style={{ fontSize: "16px" }}>Official Course Certificate</strong>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => window.print()}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px" }}
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowCertModal(false)}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="certificate-frame certificate-print-area">
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div className="cert-seal">
                  NYSC<br />SAED
                </div>
              </div>
              <h2>National Youth Service Corps</h2>
              <h4>Directorate of Skills Acquisition & Entrepreneurship Development (SAED)</h4>
              <div className="certificate-title-banner">
                Certificate of Completion
              </div>

              <p style={{ margin: "20px 0 6px", fontSize: "16px", fontStyle: "italic", color: "#374151" }}>
                This is to certify that
              </p>
              <div className="cert-student-name">
                {certificate.studentName}
              </div>
              <p style={{ margin: "4px 0 16px", fontSize: "14px", color: "#4b5563" }}>
                NYSC State Code: <strong>{certificate.stateCode || "CORPER"}</strong>
                {certificate.stateOfDeployment ? ` • Deployment: ${certificate.lgaOfDeployment ? `${certificate.lgaOfDeployment}, ` : ""}${certificate.stateOfDeployment}` : ""}
              </p>

              <p style={{ margin: "16px 0 6px", fontSize: "15px", color: "#374151" }}>
                has successfully satisfied all vocational curriculum requirements and completed the certified program in
              </p>
              <div className="cert-course-title">
                {certificate.courseTitle}
              </div>

              <div className="cert-meta-grid">
                <div>
                  <strong>Specialization:</strong> {categoryLabel(certificate.courseCategory)}<br />
                  <strong>Program Duration:</strong> {certificate.durationWeeks} Weeks
                </div>
                <div>
                  <strong>Accredited Trainer:</strong> {certificate.trainerName || "SAED Certified Trainer"}<br />
                  <strong>Organization:</strong> {certificate.trainerCompany || "SAED Training Partner"}
                </div>
              </div>

              <div className="cert-signatures">
                <div className="cert-sig-block">
                  <div className="cert-sig-line"></div>
                  <strong style={{ fontSize: "12px", textTransform: "uppercase" }}>Director, SAED NDHQ</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>National Directorate</span>
                </div>

                <div style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>
                  <div style={{ fontWeight: "700", letterSpacing: "1px", marginBottom: "2px" }}>
                    SERIAL NUMBER
                  </div>
                  <code style={{ fontSize: "12px", background: "#f1f5f9", padding: "3px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                    {certificate.certificateNumber}
                  </code>
                  <div style={{ marginTop: "4px", fontSize: "11px" }}>Issued: {certificate.issuedAt}</div>
                </div>

                <div className="cert-sig-block">
                  <div className="cert-sig-line"></div>
                  <strong style={{ fontSize: "12px", textTransform: "uppercase" }}>Training Partner</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Accredited Facilitator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
