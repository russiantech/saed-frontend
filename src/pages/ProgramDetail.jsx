import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router-dom";

import FloatingNav from "../components/FloatingNav.jsx";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function categoryLabel(programCategory) {
  return (programCategory || "").replace(/_/g, " ");
}

const DESCRIPTION_FALLBACK =
  "No description has been provided for this program yet. Check back soon for more details.";

const DESCRIPTION_CLAMP_CHARS = 280;

function normalizeDescription(raw) {
  if (raw == null) return "";
  return String(raw).replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inApp = !!useMatch({ path: "/app/*" });
  const { user, loading: authLoading } = useAuth();

  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [id]);

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
        if (active) showMsg(err.message || "Failed to load program.", "error");
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
    if (!user) {
      setApplications([]);
      return;
    }
    let active = true;
    async function loadApps() {
      try {
        const endpoint = canManage ? "/manage/applications/" : "/applications/";
        const data = await api(endpoint);
        if (active) setApplications(data.applications || []);
      } catch (err) {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (active) setApplications([]);
      }
    }
    loadApps();
    return () => {
      active = false;
    };
  }, [user, canManage, navigate]);

  const appliedProgramIds = new Set(applications.map((item) => item.program.id));
  const applied = program ? appliedProgramIds.has(program.id) : false;
  const programStudents = program
    ? applications.filter((item) => item.program.id === program.id).map((item) => item.applicant)
    : [];

  const backHref = inApp ? "/app/programs" : "/programs";

  async function apply() {
    if (!program) return;
    if (authLoading) {
      showMsg("Checking your account...");
      return;
    }

    if (!user) {
      navigate("/login", {
        state: {
          pendingProgramId: program.id,
          redirectTo: "/app",
          role: "corps_member",
        },
      });
      return;
    }

    showMsg("");
    try {
      await api("/applications/create/", {
        method: "POST",
        body: { programId: program.id, motivation: "I want to gain practical skills through SAED." },
      });
      // refresh applications so the button reflects the new state
      try {
        const data = await api(canManage ? "/manage/applications/" : "/applications/");
        setApplications(data.applications || []);
      } catch (err) {
        // ignore
      }
      showMsg("Application submitted.", "success");
      if (!inApp) {
        navigate("/app");
      }
    } catch (err) {
      if (err.status === 401) {
        navigate("/login", {
          state: {
            pendingProgramId: program.id,
            redirectTo: "/app",
            role: "corps_member",
          },
          replace: true,
        });
        return;
      }
      showMsg(err.message, "error");
    }
  }

  if (loading) {
    const loader = (
      <section className="program-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Programs
        </Link>
        <div className="screen-loader">Loading program...</div>
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
      <section className="program-detail-page">
        <Link className="back-link" to={backHref}>
          <ArrowLeft size={16} /> Back to Programs
        </Link>
        <div className="section-heading">
          <h2>Program not found</h2>
          <p>The program you are looking for does not exist or is no longer available.</p>
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

  const body = (
    <section className="program-detail-page">
      <Link className="back-link" to={backHref}>
        <ArrowLeft size={16} /> Back to Programs
      </Link>

      <div className="program-detail-hero">
        <div className="program-detail-hero-body">
          <span className="category-label">{categoryLabel(program.category)}</span>
          <h1>{program.title}</h1>
          {(() => {
            const description = normalizeDescription(program.description);
            const hasDescription = description.length > 0;
            const tooLong = description.length > DESCRIPTION_CLAMP_CHARS;
            const visibleText = hasDescription
              ? tooLong && !descriptionExpanded
                ? `${description.slice(0, DESCRIPTION_CLAMP_CHARS).trimEnd()}…`
                : description
              : DESCRIPTION_FALLBACK;

            return (
              <div className={`program-detail-description${hasDescription ? "" : " is-empty"}${tooLong ? " is-clamped" : ""}`}>
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

      <dl className="program-detail-facts">
        <div>
          <dt>Trainer</dt>
          <dd>{program.trainerName || "—"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{program.location || "—"}</dd>
        </div>
        <div>
          <dt>Slots left</dt>
          <dd>{program.availableSlots}</dd>
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
          <dt>Status</dt>
          <dd>{program.isActive ? "Active" : "Inactive"}</dd>
        </div>
      </dl>

      {staffProgramView ? (
        <section className="program-students">
          <header className="program-students-heading">
            <h4>Enrolled Students</h4>
            <span className="program-students-count">
              {programStudents.length} {programStudents.length === 1 ? "student" : "students"}
            </span>
          </header>
          {programStudents.length ? (
            <ul className="program-students-list">
              {programStudents.map((student) => (
                <li className="program-student-item" key={student.id}>
                  <div className="program-student-name">{student.fullName}</div>
                  <div className="program-student-meta">
                    <span>{student.email}</span>
                    {student.phone ? <span>{" · "}{student.phone}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="program-students-empty">No students have applied for this program yet.</p>
          )}
        </section>
      ) : null}

      {message ? (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      ) : null}

      {staffProgramView ? null : (
        <div className="program-detail-footer">
          <button
            className="primary-button"
            disabled={applied}
            onClick={apply}
            type="button"
          >
            {applied ? "Applied" : "Apply Now"}
          </button>
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
