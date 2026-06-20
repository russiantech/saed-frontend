import { Video, Play, Clock, BookOpen, X, ArrowLeft, User, CreditCard, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";

function getVideoThumbnail(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  return null;
}

export default function TraineeFastTrack() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [payingCourseId, setPayingCourseId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null);

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    api("/trainee/fast-track-courses/")
      .then((d) => setCourses(d.courses || []))
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function loadVideos(course) {
    if (coursePrice(course) > 0 && !course.isEnrolled) {
      setShowPayModal(course);
      return;
    }
    setSelectedCourse(course);
    setLoadingVideos(true);
    setVideos([]);
    try {
      const d = await api(`/fast-track-videos/${course.id}/`);
      setVideos(d.videos || []);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoadingVideos(false);
    }
  }

  async function handlePay(course) {
    setPayingCourseId(course.id);
    try {
      const data = await api("/courses/pay/", {
        method: "POST",
        body: JSON.stringify({ courseId: course.id }),
      });
      if (data.ok) {
        const proceed = window.confirm(
          `Payment initialized for "${course.title}" (₦${coursePrice(course)}).\n\n` +
          `Reference: ${data.reference}\n\n` +
          `After making payment, click OK to submit for trainer confirmation.`
        );
        if (proceed) {
          const verifyData = await api("/courses/pay/verify/", {
            method: "POST",
            body: JSON.stringify({ reference: data.reference }),
          });
          if (verifyData.ok) {
            setCourses((prev) =>
              prev.map((c) => (c.id === course.id ? { ...c, isPending: true, isEnrolled: false } : c))
            );
            setShowPayModal(null);
            showMsg("Payment submitted! Waiting for trainer to confirm.", "success");
          }
        }
      }
    } catch (err) {
      if (err.data?.pending) {
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, isPending: true, isEnrolled: false } : c))
        );
        setShowPayModal(null);
        showMsg("Payment already pending trainer confirmation.", "success");
      } else if (err.data?.slotsFull) {
        setShowPayModal(null);
        showMsg("This course is full. No slots available.", "error");
      } else {
        showMsg(err.message || "Payment failed. Please try again.", "error");
      }
    } finally {
      setPayingCourseId(null);
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function coursePrice(c) {
    return parseFloat(c.price) || 0;
  }

  if (loading) return <div className="empty-state">Loading fast track courses...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Video size={24} /> Fast Track Courses</h1>
          <p>Access fast track content for your enrolled courses</p>
        </div>
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
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
              <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
                Pay ₦{coursePrice(showPayModal)} to access all videos in this course.
              </p>
              <button
                className="primary-button"
                style={{ width: "100%", padding: "14px", fontSize: 15 }}
                onClick={() => handlePay(showPayModal)}
                disabled={payingCourseId === showPayModal.id}
              >
                {payingCourseId === showPayModal.id ? "Processing..." : `Pay ₦${coursePrice(showPayModal)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCourse ? (
        <div>
          <button className="back-link" onClick={() => { setSelectedCourse(null); setVideos([]); }} type="button">
            <ArrowLeft size={16} /> Back to courses
          </button>

          <div className="ft-course-intro">
            <h2>{selectedCourse.title}</h2>
            <span className="ft-course-trainer"><User size={14} /> {selectedCourse.trainerName}</span>
            {selectedCourse.description && (
              <p className="ft-course-desc">{selectedCourse.description}</p>
            )}
            <div className="ft-course-meta">
              {selectedCourse.durationWeeks && <span><Clock size={14} /> {selectedCourse.durationWeeks} weeks</span>}
              {selectedCourse.category && <span className="ft-badge ft-badge-cat">{selectedCourse.category}</span>}
              <span className="ft-badge ft-badge-free">{videos.length} video{videos.length !== 1 ? "s" : ""}</span>
              {coursePrice(selectedCourse) > 0 && (
                <span className={`ft-badge ${selectedCourse.isEnrolled ? "ft-badge-free" : selectedCourse.isPending ? "ft-badge-pending" : selectedCourse.isRejected ? "ft-badge-rejected" : selectedCourse.isRefunded ? "ft-badge-refunded" : "ft-badge-paid"}`}>
                  {selectedCourse.isEnrolled ? <><Check size={12} /> Enrolled</> : selectedCourse.isPending ? "⏳ Pending Confirmation" : selectedCourse.isRejected ? "Payment Rejected" : selectedCourse.isRefunded ? "Refunded" : `₦${coursePrice(selectedCourse)}`}
                </span>
              )}
            </div>
          </div>

          {loadingVideos ? (
            <div className="empty-state">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="empty-state"><p>No fast track videos available for this course yet.</p></div>
          ) : (
            <div className="ft-video-list">
              {videos.map((v, i) => {
                const thumb = getVideoThumbnail(v.videoUrl);
                return (
                  <div key={v.id} className="ft-video-card">
                    {thumb ? (
                      <div className="ft-video-thumb">
                        <img src={thumb} alt={v.title} />
                        <div className="ft-video-thumb-overlay">
                          <Play size={20} fill="#fff" color="#fff" />
                        </div>
                      </div>
                    ) : (
                      <div className="ft-video-number">{i + 1}</div>
                    )}
                    <div className="ft-video-info">
                      <strong>{v.title}</strong>
                      {v.description && <p>{v.description}</p>}
                      <div className="ft-video-meta">
                        <span><Clock size={13} /> {formatDuration(v.durationSeconds)}</span>
                        {v.isFreePreview ? (
                          <span className="ft-badge ft-badge-free">Free Preview</span>
                        ) : (
                          <span className="ft-badge ft-badge-paid">₦{v.price}</span>
                        )}
                      </div>
                    </div>
                    {v.videoUrl && (
                      <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="ft-watch-btn">
                        <Play size={14} /> Watch
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} style={{ opacity: 0.3 }} />
          <p>No fast track courses available. Connect with a trainer to access fast track content.</p>
        </div>
      ) : (
        <div className="ft-courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="ft-course-card" onClick={() => loadVideos(course)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && loadVideos(course)}>
              <div className="ft-course-card-header">
                <div className="ft-course-card-icon">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3>{course.title}</h3>
                  <span className="ft-course-card-trainer">{course.trainerName}</span>
                </div>
              </div>
              {course.description && <p className="ft-course-card-desc">{course.description}</p>}
              <div className="ft-course-card-footer">
                <span className="ft-badge ft-badge-free">{course.videoCount} video{course.videoCount !== 1 ? "s" : ""}</span>
                {coursePrice(course) > 0 ? (
                  course.isEnrolled ? (
                    <span className="ft-badge ft-badge-free"><Check size={12} /> Enrolled</span>
                  ) : course.isPending ? (
                    <span className="ft-badge ft-badge-pending">⏳ Pending</span>
                  ) : course.isRejected ? (
                    <span className="ft-badge ft-badge-rejected">Payment Rejected</span>
                  ) : course.isRefunded ? (
                    <span className="ft-badge ft-badge-refunded">Refunded</span>
                  ) : (
                    <button
                      className="ft-pay-btn"
                      onClick={(e) => { e.stopPropagation(); handlePay(course); }}
                      disabled={payingCourseId === course.id}
                    >
                      <CreditCard size={13} /> Pay ₦{coursePrice(course)}
                    </button>
                  )
                ) : (
                  <span className="ft-view-link">View Course <Play size={12} /></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
