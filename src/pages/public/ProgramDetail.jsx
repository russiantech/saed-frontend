import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";

import FloatingNav from "../../components/layout/FloatingNav.jsx";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

function categoryLabel(programCategory) {
  return (programCategory || "").replace(/_/g, " ");
}

const DESCRIPTION_FALLBACK =
  "No description has been provided for this course yet. Check back soon for more details.";

const DESCRIPTION_CLAMP_CHARS = 280;

function normalizeDescription(raw) {
  if (raw == null) return "";
  return String(raw).replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export default function ProgramDetail() {
  const { id } = useParams();
  const inApp = !!useMatch({ path: "/app/*" });
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentStatusLoading, setEnrollmentStatusLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [id]);

  const isCorpsMember = user?.role === "corps_member";
  const isTrainer = user?.role === "trainer";
  const canManage = ["saed_admin", "dunis_admin", "trainer"].includes(user?.role);
  const staffProgramView = inApp && canManage;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const endpoint = inApp && isTrainer ? "/manage/programs/" : "/programs/";
        const data = await api(endpoint);
        if (!active) return;
        const match = (data.programs || []).find((item) => String(item.id) === String(id));
        setProgram(match || null);
      } catch (err) {
        if (active) showMsg(err.message || "Failed to load course.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id, inApp, isTrainer]);

  useEffect(() => {
    if (!user || !program || user.role !== "corps_member") return;
    let active = true;
    setEnrollmentStatusLoading(true);
    api(`/courses/${program.id}/enrollment-status/`)
      .then((data) => {
        if (!active) return;
        setEnrollmentStatus(data);
        if (data.enrolled && data.isPaid) {
          api(`/courses/${program.id}/progress/`)
            .then((p) => { if (active) setProgress(p); })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setEnrollmentStatusLoading(false); });
    return () => { active = false; };
  }, [user, program]);

  const backHref = inApp ? "/app/programs" : "/programs";

  async function handleEnroll() {
    if (!program) return;
    if (authLoading) {
      showMsg("Checking your account...");
      return;
    }

    const redirectToLogin = () => {
      navigate("/login", {
        replace: true,
        state: {
          pendingProgramId: program.id,
          redirectTo: `/app/programs/${program.id}`,
          role: "corps_member",
        },
      });
    };

    if (!user) {
      redirectToLogin();
      return;
    }

    const activeUser = await refreshUser();
    if (!activeUser) {
      redirectToLogin();
      return;
    }

    showMsg("");
    setEnrolling(true);
    try {
      const price = Number(program.price);

      if (price > 0) {
        const data = await api("/courses/pay/", {
          method: "POST",
          body: { courseId: program.id },
        });
        if (data.authorization_url) {
          window.location.assign(data.authorization_url);
          return;
        }
      }

      await api("/applications/create/", {
        method: "POST",
        body: { programId: program.id },
      });
      showMsg("Enrollment submitted. Awaiting trainer confirmation.", "success");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", {
          state: {
            pendingProgramId: program.id,
            redirectTo: `/app/programs/${program.id}`,
            role: "corps_member",
          },
          replace: true,
        });
        return;
      }
      if (err.status === 403 && err.message?.includes("Connect with this course")) {
        navigate(`/app/connect-trainer/${program.trainerId}`);
        return;
      }
      showMsg(err.message || "Failed to enroll.", "error");
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    const loader = (
      <section className="course-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="screen-loader">Loading course...</div>
      </section>
    );
    if (inApp) return loader;
    return (
      <div className="site-page">
        <FloatingNav />
        {loader}
      </div>
    );
  }

  if (!program) {
    const notFound = (
      <section className="course-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="section-heading">
          <h2>Course not found</h2>
          <p>The course you are looking for does not exist or is no longer available.</p>
        </div>
      </section>
    );
    if (inApp) return notFound;
    return (
      <div className="site-page">
        <FloatingNav />
        {notFound}
      </div>
    );
  }

  const price = Number(program.price);
  const isFree = price === 0;

  const body = (
    <section className="course-detail-page">
      <Link className="back-link" to={backHref}>
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="course-detail-hero">
        <div className="course-detail-hero-body">
          <span className="category-label">{categoryLabel(program.category)}</span>
          <h1>{program.title}</h1>
          {(() => {
            const description = normalizeDescription(program.description);
            const hasDescription = description.length > 0;
            const tooLong = description.length > DESCRIPTION_CLAMP_CHARS;
            const visibleText = hasDescription
              ? tooLong && !descriptionExpanded
                ? `${description.slice(0, DESCRIPTION_CLAMP_CHARS).trimEnd()}\u2026`
                : description
              : DESCRIPTION_FALLBACK;

            return (
              <div className={`course-detail-description${hasDescription ? "" : " is-empty"}${tooLong ? " is-clamped" : ""}`}>
                {visibleText.split("\n").map((line, index, arr) => (
                  <span key={index}>
                    {line}
                    {index < arr.length - 1 ? <br /> : null}
                  </span>
                ))}
                {hasDescription && tooLong ? (
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => setDescriptionExpanded((value) => !value)}
                    aria-expanded={descriptionExpanded}
                  >
                    {descriptionExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
            );
          })()}
        </div>
      </div>

      <dl className="course-detail-facts">
        <div>
          <dt>Trainer</dt>
          <dd>{program.trainerName || "\u2014"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{program.location || "\u2014"}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{isFree ? "Free" : `\u20a6${price.toLocaleString()}`}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{program.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{program.capacity}</dd>
        </div>
        <div>
          <dt>Slots Left</dt>
          <dd>{program.availableSlots}</dd>
        </div>
      </dl>

      {program.startDate && (
        <div className="course-detail-section">
          <h4>Start Date</h4>
          <p>{new Date(program.startDate).toLocaleDateString()}</p>
        </div>
      )}

      {program.isRestricted && (
        <div className="inline-message inline-message--error" style={{ marginTop: 16 }}>
          This course is restricted. Only approved applicants can enroll.
        </div>
      )}

      {program.trainerName && (
        <div className="course-students">
          <header className="course-students-heading">
            <h4>Trainer</h4>
          </header>
          <ul className="course-students-list">
            <li className="course-student-item">
              <div className="course-student-name">{program.trainerName}</div>
            </li>
          </ul>
        </div>
      )}

      {staffProgramView && program.enrolledCount > 0 && (
        <section className="course-students">
          <header className="course-students-heading">
            <h4>Enrolled Students</h4>
            <span className="course-students-count">
              {program.enrolledCount} {program.enrolledCount === 1 ? "student" : "students"}
            </span>
          </header>
        </section>
      )}

      {message ? (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      ) : null}

      {(!user || isCorpsMember) && !staffProgramView && !program.isRestricted && !(user && enrollmentStatusLoading) && (
        <div className="course-detail-footer">
          {enrollmentStatus?.enrolled && enrollmentStatus?.isPaid ? (
            <div className="inline-message inline-message--success" style={{ margin: 0, width: "100%" }}>
              You are enrolled in this course.
              {progress && progress.totalLessons > 0 && (
                <div className="progress-bar-wrapper" style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
                  </div>
                  <span className="progress-text">{progress.completedLessons}/{progress.totalLessons} lessons ({progress.percentage}%)</span>
                </div>
              )}
            </div>
          ) : (
            <button
              className="primary-button"
              disabled={enrolling}
              onClick={handleEnroll}
              type="button"
            >
              {enrolling ? "Enrolling..." : isFree ? "Enroll Now" : `Pay \u20a6${price.toLocaleString()} & Enroll`}
            </button>
          )}
        </div>
      )}
    </section>
  );

  if (inApp) return body;
  return (
    <div className="site-page">
      <FloatingNav />
      {body}
    </div>
  );
}
