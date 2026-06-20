import { BookOpen, Clock, DollarSign, Users, ChevronLeft, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/courses/${courseId}/`);
        setCourse(data.course);
        setTrainer(data.trainer);
        setVideos(data.videos || []);
      } catch (err) {
        setError(err.message || "Course not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) return <div className="empty-state">Loading course...</div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (!course) return null;

  return (
    <div className="page-container">
      <button className="back-link" onClick={() => navigate(-1)}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-heading">
          <div>
            <span className="category-label">{course.category || "Course"}</span>
            <h1>{course.title}</h1>
          </div>
          {course.isRestricted && <span className="status-pill status-restricted">Restricted</span>}
        </div>

        {course.description && <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{course.description}</p>}

        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginTop: 20 }}>
          <div><dt style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Duration</dt><dd style={{ marginTop: 4 }}><Clock size={14} /> {course.durationWeeks} weeks</dd></div>
          <div><dt style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Price</dt><dd style={{ marginTop: 4 }}><DollarSign size={14} /> {Number(course.price) === 0 ? "Free" : `₦${course.price}`}</dd></div>
          <div><dt style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Max Students</dt><dd style={{ marginTop: 4 }}><Users size={14} /> {course.maxStudents}</dd></div>
          {course.startDate && <div><dt style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Start Date</dt><dd style={{ marginTop: 4 }}>{new Date(course.startDate).toLocaleDateString()}</dd></div>}
          {course.endDate && <div><dt style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>End Date</dt><dd style={{ marginTop: 4 }}>{new Date(course.endDate).toLocaleDateString()}</dd></div>}
        </dl>

        {trainer && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--surface-border)" }}>
            <h3 style={{ fontSize: 14, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>Trainer</h3>
            <Link to={`/app/connect-trainer/${trainer.id}`} className="program-row clickable" style={{ textDecoration: "none" }}>
              <div>
                <div className="trainer-avatar-inline">
                  {trainer.profilePicture ? (
                    <img src={trainer.profilePicture} alt={trainer.fullName} />
                  ) : (
                    trainer.fullName?.charAt(0)
                  )}
                </div>
                <div>
                  <strong>{trainer.fullName}</strong>
                  <span>{trainer.specialization} · {trainer.companyName || "Independent"}</span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {videos.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-heading">
            <h2><Play size={18} /> Fast Track Courses ({videos.length})</h2>
          </div>
          <div className="program-list">
            {videos.map((video) => (
              <article key={video.id} className="program-row">
                <div>
                  <strong>{video.title}</strong>
                  <span>{video.description || "No description"}</span>
                  <span>{Math.floor(video.durationSeconds / 60)}m {video.durationSeconds % 60}s · {video.isFreePreview ? "Free Preview" : "Paid"}</span>
                </div>
                <span className="status-pill">{Number(video.price) === 0 ? "Free" : `₦${video.price}`}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {!course.hasFastTrack && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="empty-state">
            <p>No fast track videos available for this course.</p>
          </div>
        </div>
      )}
    </div>
  );
}
