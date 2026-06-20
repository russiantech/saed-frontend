import { BookOpen, Users, UserCheck, Clock3, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import DunisAdmin from "./DunisAdmin.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  useEffect(() => {
    api("/dashboard/")
      .then(setData)
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showMsg(err.message, "error");
      });
  }, [navigate]);

  if (error) return (
    <div className={`inline-message inline-message--${messageType || "error"}`}>
      {error}
      <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
    </div>
  );
  if (!data) return <div className="empty-state">Loading dashboard...</div>;

  const stats = data.stats || {};
  const isCorpsMember = user?.role === "corps_member";
  const isAdmin = user?.role === "saed_admin" || user?.role === "dunis_admin";
  const isTrainer = user?.role === "trainer";
  const isDunisAdmin = user?.role === "dunis_admin";

  return (
    <div className="dashboard-grid">
      {isCorpsMember && (
        <>
          <section className="panel lga-widget">
            <div className="panel-heading">
              <h2><UserCheck size={18} /> Your Profile</h2>
            </div>
            <div className="lga-info">
              <div className="lga-detail"><span>Skill Interest</span><strong>{user?.skillInterest || "—"}</strong></div>
              <div className="lga-detail"><span>LGA</span><strong>{user?.lgaOfDeployment || "—"}</strong></div>
              <div className="lga-detail"><span>State Code</span><strong>{user?.nyscStateCode || "—"}</strong></div>
            </div>
          </section>
          <section className="stat-grid">
            <article className="stat-card">
              <BookOpen size={22} />
              <span>Applications</span>
              <strong>{stats.applications || 0}</strong>
            </article>
            <article className="stat-card">
              <Clock3 size={22} />
              <span>Pending</span>
              <strong>{stats.pending || 0}</strong>
            </article>
            <article className="stat-card">
              <CheckCircle2 size={22} />
              <span>Approved</span>
              <strong>{stats.approved || 0}</strong>
            </article>
            <article className="stat-card">
              <Users size={22} />
              <span>Connections</span>
              <strong>{stats.connections || 0}</strong>
            </article>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <Link className="primary-button" to="/app/profile">View Profile</Link>
              <Link className="primary-button" to="/app/my-trainers">Browse Trainers</Link>
              <Link className="primary-button" to="/app/programs">Browse Programs</Link>
              <Link className="primary-button" to="/app/applications">My Applications</Link>
            </div>
          </section>
        </>
      )}

      {isTrainer && (
        <>
          <section className="stat-grid">
            <article className="stat-card">
              <BookOpen size={22} />
              <span>My Courses</span>
              <strong>{stats.courses || 0}</strong>
            </article>
            <article className="stat-card">
              <Users size={22} />
              <span>Connected Corps Members</span>
              <strong>{stats.corpers || 0}</strong>
            </article>
            <article className="stat-card">
              <BookOpen size={22} />
              <span>Programs</span>
              <strong>{stats.programs || 0}</strong>
            </article>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <Link className="primary-button" to="/app/profile">View Profile</Link>
              <Link className="primary-button" to="/app/course-management">Manage Courses</Link>
              <Link className="primary-button" to="/app/my-corpers">View Corps Members</Link>
              {user?.canUploadFastTrack && <Link className="primary-button" to="/app/fast-track-videos">Fast Track Courses</Link>}
            </div>
          </section>
        </>
      )}

      {isDunisAdmin && <DunisAdmin />}

      {isAdmin && !isDunisAdmin && (
        <>
          <section className="stat-grid">
            <article className="stat-card">
              <Users size={22} />
              <span>Approved Partners</span>
              <strong>{stats.approvedTrainers || 0}</strong>
            </article>
            <article className="stat-card">
              <Clock3 size={22} />
              <span>Pending Review</span>
              <strong>{stats.pendingTrainers || 0}</strong>
            </article>
            <article className="stat-card">
              <Users size={22} />
              <span>Corps Members</span>
              <strong>{stats.totalCorpers || 0}</strong>
            </article>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <Link className="primary-button" to="/app/profile">View Profile</Link>
              <Link className="primary-button" to="/app/users">Manage Trainers</Link>
              <Link className="primary-button" to="/app/program-editor">Manage Programs</Link>
              <Link className="primary-button" to="/app/admin-courses">Manage Courses</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
