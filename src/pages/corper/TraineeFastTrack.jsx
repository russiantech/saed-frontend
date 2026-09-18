import { Video, Play, Clock, BookOpen, X, ArrowLeft, User, CreditCard, Check, ChevronDown, ChevronRight, Layers, FileText, File, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";

function getVideoThumbnail(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

const CONTENT_ICONS = { video: Video, text: FileText, quiz: HelpCircle, document: File };

function formatDuration(seconds) {
  if (!seconds) return "\u2014";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TraineeFastTrack() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [payingCourseId, setPayingCourseId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [completingId, setCompletingId] = useState(null);

  function showMsg(text, type) { setError(text); setMessageType(type || ""); }

  useEffect(() => {
    api("/trainee/fast-track-courses/")
      .then((d) => setCourses(d.courses || []))
      .catch((err) => {
        if (err.status === 401) { navigate("/login", { replace: true }); return; }
        showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function loadContent(course) {
    if (coursePrice(course) > 0 && !course.isEnrolled) { setShowPayModal(course); return; }
    setSelectedCourse(course);
    setLoadingContent(true);
    setModules([]);
    setVideos([]);
    try {
      const d = await api(`/fast-track-videos/${course.id}/`);
      setModules(d.modules || []);
      setVideos(d.videos || []);
      setCompletedLessonIds(d.completedLessonIds || []);
      const expanded = {};
      (d.modules || []).forEach((m) => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (err) { showMsg(err.message, "error"); }
    finally { setLoadingContent(false); }
  }

  async function handlePay(course) {
    setPayingCourseId(course.id);
    try {
      const data = await api("/courses/pay/", { method: "POST", body: { courseId: course.id } });
      if (data.ok) { window.location.assign(data.authorization_url); return; }
    } catch (err) {
      if (err.data?.pending) {
        setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, isPending: true, isEnrolled: false } : c)));
        setShowPayModal(null); showMsg("Payment pending trainer confirmation.", "success");
      } else if (err.data?.slotsFull) { setShowPayModal(null); showMsg("Course is full.", "error"); }
      else { showMsg(err.message || "Payment failed.", "error"); }
    } finally { setPayingCourseId(null); }
  }

  function coursePrice(c) { return parseFloat(c.price) || 0; }
  function toggleModule(id) { setExpandedModules((p) => ({ ...p, [id]: !p[id] })); }

  function totalLessons() { return modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) + videos.length; }
  function totalCompleted() { return completedLessonIds.length; }

  async function handleMarkComplete(lessonId) {
    if (!selectedCourse) return;
    setCompletingId(lessonId);
    try {
      await api(`/courses/${selectedCourse.id}/lessons/${lessonId}/complete/`, { method: "POST" });
      setCompletedLessonIds((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
    } catch (err) {
      showMsg(err.message || "Could not mark as complete.", "error");
    } finally {
      setCompletingId(null);
    }
  }

  if (loading) return <div className="empty-state">Loading fast track courses...</div>;

  return (
    <div className="page-container">
      <div className="page-header"><div><h1><Video size={24} /> Fast Track Courses</h1><p>Access fast track content for your enrolled courses</p></div></div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}<button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {showPayModal && (
        <div className="camera-modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-modal-header">
              <h3>Pay for Course</h3>
              <button type="button" className="camera-modal-close" onClick={() => setShowPayModal(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, textAlign: "center" }}>
              <CreditCard size={48} style={{ color: "var(--brand)", marginBottom: 12 }} />
              <h3 style={{ margin: "0 0 8px" }}>{showPayModal.title}</h3>
              <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>Pay ₦{coursePrice(showPayModal)} to access all content.</p>
              <button className="primary-button" style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={() => handlePay(showPayModal)} disabled={payingCourseId === showPayModal.id}>
                {payingCourseId === showPayModal.id ? "Processing..." : `Pay ₦${coursePrice(showPayModal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCourse ? (
        <div>
          <button className="back-link" onClick={() => { setSelectedCourse(null); setModules([]); setVideos([]); }} type="button"><ArrowLeft size={16} /> Back to courses</button>

          <div className="ft-course-intro">
            <h2>{selectedCourse.title}</h2>
            <span className="ft-course-trainer"><User size={14} /> {selectedCourse.trainerName}</span>
            {selectedCourse.description && <p className="ft-course-desc">{selectedCourse.description}</p>}
            <div className="ft-course-meta">
              {selectedCourse.durationWeeks && <span><Clock size={14} /> {selectedCourse.durationWeeks} weeks</span>}
              {selectedCourse.category && <span className="ft-badge ft-badge-cat">{selectedCourse.category}</span>}
              <span className="ft-badge ft-badge-free">{modules.length} module{modules.length !== 1 ? "s" : ""} &middot; {totalLessons()} lesson{totalLessons() !== 1 ? "s" : ""}</span>
              {selectedCourse.isEnrolled && totalLessons() > 0 && (
                <span className="ft-badge ft-badge-cat">{totalCompleted()}/{totalLessons()} completed</span>
              )}
              {coursePrice(selectedCourse) > 0 && (
                <span className={`ft-badge ${selectedCourse.isEnrolled ? "ft-badge-free" : selectedCourse.isPending ? "ft-badge-pending" : "ft-badge-paid"}`}>
                  {selectedCourse.isEnrolled ? <><Check size={12} /> Enrolled</> : selectedCourse.isPending ? "Pending" : `₦${coursePrice(selectedCourse)}`}
                </span>
              )}
            </div>
          </div>

          {loadingContent ? (
            <div className="empty-state">Loading content...</div>
          ) : (
            <>
              {modules.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {modules.map((m) => {
                    const expanded = expandedModules[m.id] !== false;
                    return (
                      <div key={m.id} className="ft-course-card" style={{ cursor: "default" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => toggleModule(m.id)}>
                          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <Layers size={18} style={{ color: "var(--primary)" }} />
                          <div style={{ flex: 1 }}>
                            <strong>{m.title}</strong>
                            {m.description && <div style={{ fontSize: 13, color: "var(--muted)" }}>{m.description}</div>}
                          </div>
                          <span className="ft-badge ft-badge-free">{m.lessons?.length || 0} lessons</span>
                        </div>
                        {expanded && m.lessons && m.lessons.length > 0 && (
                          <div className="ft-video-list" style={{ marginTop: 12 }}>
                            {m.lessons.map((l) => {
                              const Icon = CONTENT_ICONS[l.contentType] || FileText;
                              const thumb = l.contentType === "video" ? getVideoThumbnail(l.videoUrl) : null;
                              return (
                                <div key={l.id} className="ft-video-card">
                                  {thumb ? (
                                    <div className="ft-video-thumb"><img src={thumb} alt={l.title} /><div className="ft-video-thumb-overlay"><Play size={20} fill="#fff" color="#fff" /></div></div>
                                  ) : (
                                    <div className="ft-video-number"><Icon size={20} /></div>
                                  )}
                                  <div className="ft-video-info">
                                    <strong>{l.title}</strong>
                                    {l.description && <p>{l.description}</p>}
                                    <div className="ft-video-meta">
                                      {l.contentType === "video" && <span><Clock size={13} /> {formatDuration(l.durationSeconds)}</span>}
                                      <span className="ft-badge ft-badge-cat">{l.contentType}</span>
                                      {l.isFreePreview && <span className="ft-badge ft-badge-free">Free Preview</span>}
                                    </div>
                                  </div>
                                  {l.contentType === "video" && l.videoUrl && (
                                    <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="ft-watch-btn"><Play size={14} /> Watch</a>
                                  )}
                                  {l.contentType === "document" && l.documentUrl && (
                                    <a href={l.documentUrl} target="_blank" rel="noopener noreferrer" className="ft-watch-btn"><File size={14} /> View</a>
                                  )}
                                  {selectedCourse.isEnrolled && (
                                    completedLessonIds.includes(l.id) ? (
                                      <span className="ft-watch-btn" style={{ background: "var(--brand)", color: "#fff", opacity: 0.8 }}><Check size={14} /> Done</span>
                                    ) : (
                                      <button className="ft-watch-btn" onClick={() => handleMarkComplete(l.id)} disabled={completingId === l.id}>
                                        {completingId === l.id ? "Saving..." : <><Check size={14} /> Mark Complete</>}
                                      </button>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {videos.length > 0 && (
                <div style={{ marginTop: modules.length > 0 ? 20 : 0 }}>
                  {modules.length > 0 && <h3 style={{ marginBottom: 12 }}>Additional Videos</h3>}
                  <div className="ft-video-list">
                    {videos.map((v, i) => {
                      const thumb = getVideoThumbnail(v.videoUrl);
                      return (
                        <div key={v.id} className="ft-video-card">
                          {thumb ? (
                            <div className="ft-video-thumb"><img src={thumb} alt={v.title} /><div className="ft-video-thumb-overlay"><Play size={20} fill="#fff" color="#fff" /></div></div>
                          ) : (
                            <div className="ft-video-number">{i + 1}</div>
                          )}
                          <div className="ft-video-info">
                            <strong>{v.title}</strong>
                            {v.description && <p>{v.description}</p>}
                            <div className="ft-video-meta">
                              <span><Clock size={13} /> {formatDuration(v.durationSeconds)}</span>
                              {v.isFreePreview ? <span className="ft-badge ft-badge-free">Free Preview</span> : <span className="ft-badge ft-badge-paid">₦{v.price}</span>}
                            </div>
                          </div>
                          {v.videoUrl && <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="ft-watch-btn"><Play size={14} /> Watch</a>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {modules.length === 0 && videos.length === 0 && (
                <div className="empty-state"><p>No content available for this course yet.</p></div>
              )}
            </>
          )}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state"><BookOpen size={48} style={{ opacity: 0.3 }} /><p>No fast track courses available. Connect with a trainer first.</p></div>
      ) : (
        <div className="ft-courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="ft-course-card" onClick={() => loadContent(course)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && loadContent(course)}>
              <div className="ft-course-card-header">
                <div className="ft-course-card-icon"><BookOpen size={22} /></div>
                <div><h3>{course.title}</h3><span className="ft-course-card-trainer">{course.trainerName}</span></div>
              </div>
              {course.description && <p className="ft-course-card-desc">{course.description}</p>}
              <div className="ft-course-card-footer">
                <span className="ft-badge ft-badge-free">{course.moduleCount || 0} module{(course.moduleCount || 0) !== 1 ? "s" : ""}</span>
                {coursePrice(course) > 0 ? (
                  course.isEnrolled ? <span className="ft-badge ft-badge-free"><Check size={12} /> Enrolled</span>
                  : course.isPending ? <span className="ft-badge ft-badge-pending">Pending</span>
                  : course.isRejected ? <span className="ft-badge ft-badge-rejected">Rejected</span>
                  : course.isRefunded ? <span className="ft-badge ft-badge-refunded">Refunded</span>
                  : <button className="ft-pay-btn" onClick={(e) => { e.stopPropagation(); handlePay(course); }} disabled={payingCourseId === course.id}><CreditCard size={13} /> Pay ₦{coursePrice(course)}</button>
                ) : <span className="ft-view-link">View Course <Play size={12} /></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
