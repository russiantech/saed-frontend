// Shared course page: details, one-step enrolment, in-app lessons, lesson payments.
import { CheckCircle2, Clock3, Lock, PlayCircle, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { api } from "lib/api.js";
import { useAuth } from "lib/auth.jsx";
import { naira, payFlow } from "lib/payments.js";
import LessonMedia from "components/ui/LessonMedia.jsx";
import { typeLabel } from "pages/corper/CourseCard.jsx";
import "styles/corper.css";

function LessonIcon({ l, done }) {
  if (done) return <CheckCircle2 size={16} color="#0b6b3a" />;
  if (l.hasAccess) return l.requiresPayment ? <Unlock size={16} /> : <PlayCircle size={16} />;
  if (l.state === "requested") return <Clock3 size={16} />;
  return <Lock size={16} />;
}

function lessonSub(l) {
  if (l.state === "owner") return l.requiresPayment ? `Locked · ${naira(l.price)}` : "Free";
  if (l.state === "enrol_required") return l.requiresPayment ? `Premium · ${naira(l.price)}` : "Free";
  if (l.state === "requested") return "Awaiting trainer";
  if (l.state === "locked") return `Locked · ${naira(l.price)}`;
  if (l.state === "unlocked") return "Unlocked";
  return "Free";
}

export default function CourseView() {
  const { courseId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [viewerError, setViewerError] = useState("");
  const lessonId = Number(params.get("lesson")) || null;

  const load = useCallback(() => api(`/courses/${courseId}/`).then((d) => { setData(d); setError(""); }).catch((e) => setError(e.message)), [courseId]);
  useEffect(() => { load(); }, [load]);

  const loadLesson = useCallback((id) => {
    if (!id) { setViewer(null); return Promise.resolve(); }
    setViewerError("");
    return api(`/lessons/${id}/`).then(setViewer).catch((e) => { setViewer(null); setViewerError(e.message); });
  }, []);
  useEffect(() => { loadLesson(lessonId); }, [lessonId, loadLesson]);

  // First visit: open the first lesson the user can actually open.
  useEffect(() => {
    if (data && !lessonId && data.lessons?.length && (data.canConsume || data.isOwner)) {
      const first = data.lessons.find((l) => l.hasAccess) || data.lessons[0];
      setParams({ lesson: String(first.id) }, { replace: true });
    }
  }, [data, lessonId, setParams]);

  if (error) return <div className="inline-message inline-message--error">{error}</div>;
  if (!data) return <div className="empty-state">Loading course…</div>;

  const { course, lessons, progress, isOwner, isEnrolled, canConsume, inCampBlocked } = data;
  const done = new Set(progress?.completedLessonIds || []);
  const isStudent = user?.role === "corps_member";
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const go = (l) => l && setParams({ lesson: String(l.id) });

  async function enrol() {
    setBusy("enrol"); setNotice(null);
    try {
      const r = await api(`/courses/${courseId}/enroll/`, { method: "POST" });
      setNotice({ type: "success", text: r.message || "Enrolled." });
      await load();
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setBusy(""); }
  }

  async function pay(l) {
    setBusy("pay"); setNotice(null);
    try {
      const r = await payFlow("/payments/lesson/", { lessonId: l.id });
      if (r.status === "success") { setNotice({ type: "success", text: "Payment confirmed. Lesson unlocked." }); await Promise.all([load(), loadLesson(l.id)]); }
      else if (r.status === "mismatch") setNotice({ type: "warn", text: "Your payment is under review. You have not lost your money; access is added as soon as it is confirmed." });
      else if (r.status === "pending") setNotice({ type: "warn", text: "Your payment is still processing. Access is added automatically once your bank confirms." });
      else if (r.status === "closed") setNotice({ type: "warn", text: "Payment window closed. No money was taken." });
      else setNotice({ type: "error", text: r.message || "Payment was not completed. No money was taken." });
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setBusy(""); }
  }

  async function requestTransfer(l) {
    setBusy("transfer"); setNotice(null);
    try {
      const r = await api(`/lessons/${l.id}/request-access/`, { method: "POST" });
      setNotice({ type: "success", text: r.message || "Request sent. The trainer will unlock the lesson once they confirm your transfer." });
      await Promise.all([load(), loadLesson(l.id)]);
    } catch (e) { setNotice({ type: "error", text: e.message }); } finally { setBusy(""); }
  }

  async function complete(l) {
    try { await api(`/courses/${courseId}/lessons/${l.id}/complete/`, { method: "POST" }); await load(); } catch (e) { setNotice({ type: "error", text: e.message }); }
  }

  const lesson = viewer?.lesson;
  const opts = viewer?.paymentOptions;

  return (
    <div className="cp-page">
      <section className="panel" style={{ padding: 20, display: "grid", gap: 10 }}>
        <div className="cp-badges">
          <span className={`cp-badge ${course.courseType === "in_camp" ? "cp-badge--warn" : ""}`}>{typeLabel(course.courseType)}</span>
          {course.categoryLabel && <span className="cp-badge">{course.categoryLabel}</span>}
          {isEnrolled && <span className="cp-badge cp-badge--ok">Enrolled</span>}
        </div>
        <h2 style={{ margin: 0 }}>{course.title}</h2>
        {course.trainer && <p style={{ margin: 0 }}>By <Link to={isStudent ? `/app/trainers/${course.trainer.id}` : "#"}>{course.trainer.fullName}</Link>{course.trainingLocation ? ` · ${course.trainingLocation}` : ""}</p>}
        {course.description && <p style={{ margin: 0 }}>{course.description}</p>}
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {course.lessonCount} lessons · {course.freeLessonCount} free{course.paidLessonCount ? ` · ${course.paidLessonCount} premium` : ""} · {course.availableSlots} slots left
        </p>
        {progress && isEnrolled && (
          <div><div className="cp-progress"><span style={{ width: `${progress.percentage}%` }} /></div>
            <small>{progress.completedLessons}/{progress.totalLessons} complete</small></div>
        )}
        {isOwner && <Link className="ghost-button" to={`/app/my-courses/${course.id}`} style={{ justifySelf: "start" }}>Manage course</Link>}
        {isStudent && !isEnrolled && !inCampBlocked && (
          <button className="primary-button" disabled={busy === "enrol" || course.availableSlots <= 0} onClick={enrol} style={{ justifySelf: "start" }}>
            {busy === "enrol" ? "Enrolling…" : course.availableSlots <= 0 ? "Course full" : "Enrol now"}
          </button>
        )}
        {isStudent && isEnrolled && course.trainer && <small>Connected to {course.trainer.fullName}</small>}
        {inCampBlocked && <div className="inline-message inline-message--error">Your In-Camp access has ended. Post-Camp courses remain available.</div>}
      </section>

      {notice && <div className={`inline-message inline-message--${notice.type === "warn" ? "warning" : notice.type}`} role="status">{notice.text}</div>}

      {data.sessions?.length > 0 && (
        <section className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Scheduled sessions</h3>
          <ul className="cp-timetable">{data.sessions.map((s) => <li key={s.id}>{s.title} — {s.scheduledDate} {s.startTime || ""}{s.venue ? ` · ${s.venue}` : ""}</li>)}</ul>
        </section>
      )}

      <div className="cp-course">
        <aside className="cp-lessons" aria-label="Lessons">
          {lessons.length === 0 && <p style={{ margin: 8 }}>No lessons yet.</p>}
          {lessons.map((l, i) => (
            <button key={l.id} type="button" className="cp-lesson" aria-current={l.id === lessonId} onClick={() => go(l)}>
              <span><strong>{i + 1}. {l.title}</strong><small>{lessonSub(l)}</small></span>
              <LessonIcon l={l} done={done.has(l.id)} />
            </button>
          ))}
        </aside>

        <main className="cp-main">
          {!lessonId && <div className="empty-state">{canConsume || isOwner ? "Select a lesson to begin." : "Enrol to start learning. Free lessons open immediately."}</div>}
          {viewerError && <div className="inline-message inline-message--error">{viewerError}</div>}
          {lesson && (
            <>
              <div>
                <h3 style={{ margin: 0 }}>{lesson.title}</h3>
                {lesson.description && <p style={{ color: "var(--muted)" }}>{lesson.description}</p>}
              </div>

              {lesson.hasAccess ? (
                <>
                  <LessonMedia lesson={lesson} />
                  {isStudent && !done.has(lesson.id) && <button className="primary-button" style={{ justifySelf: "start" }} onClick={() => complete(lesson)}>Mark as complete</button>}
                  {done.has(lesson.id) && <span className="cp-badge cp-badge--ok" style={{ justifySelf: "start" }}>Completed</span>}
                </>
              ) : lesson.state === "enrol_required" ? (
                <div className="cp-lock">
                  <strong>Enrol in this course to open this lesson{lesson.requiresPayment ? ` (${naira(lesson.price)})` : ""}.</strong>
                  {!inCampBlocked && <button className="primary-button" onClick={enrol} disabled={busy === "enrol"}>Enrol now</button>}
                </div>
              ) : (
                <div className="cp-lock">
                  <strong><Lock size={16} /> This is a premium lesson · {naira(lesson.price)}</strong>
                  {lesson.state === "requested" ? (
                    <p style={{ margin: 0 }}>Your bank-transfer request was sent. The trainer will unlock this lesson after confirming your payment.</p>
                  ) : (
                    <>
                      <button className="primary-button" disabled={busy === "pay"} onClick={() => pay(lesson)} style={{ justifySelf: "start" }}>
                        {busy === "pay" ? "Opening Paystack…" : `Pay ${naira(lesson.price)} with Paystack`}
                      </button>
                      {opts?.bankTransfer && (
                        <>
                          <span style={{ fontSize: 13, color: "var(--muted)" }}>or pay the trainer directly by bank transfer:</span>
                          <div className="cp-bank">
                            <span><strong>{opts.bankTransfer.bankName}</strong></span>
                            <span>{opts.bankTransfer.accountNumber}</span>
                            <span>{opts.bankTransfer.accountName}</span>
                          </div>
                          <button className="ghost-button" disabled={busy === "transfer"} onClick={() => requestTransfer(lesson)} style={{ justifySelf: "start" }}>
                            I have paid by transfer — notify trainer
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="cp-nav">
                <button className="ghost-button" disabled={idx <= 0} onClick={() => go(lessons[idx - 1])}>← Previous</button>
                <button className="ghost-button" disabled={idx < 0 || idx >= lessons.length - 1} onClick={() => go(lessons[idx + 1])}>Next →</button>
              </div>
            </>
          )}
        </main>
      </div>
      {!isStudent && !isOwner && <button className="ghost-button" onClick={() => navigate(-1)}>Back</button>}
    </div>
  );
}
