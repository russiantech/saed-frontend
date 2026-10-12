import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";

function categoryLabel(category) {
  return (category || "").replace(/_/g, " ");
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/courses/${courseId}/`);
        setCourse(data.course);
        setTrainer(data.trainer);
        setEnrolledCount(data.enrolledCount || 0);
      } catch (err) {
        setError(err.message || "Course not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

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
    </section>
  );
}
