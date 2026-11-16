import { BookOpen, CheckCircle2, CreditCard, GraduationCap, Tent, UserCheck, Users, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";
import { naira } from "../../lib/payments.js";

const Stat = ({ icon: Icon, label, value, to }) => {
  const body = (<article className="stat-card"><Icon size={22} /><span>{label}</span><strong>{value}</strong></article>);
  return to ? <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link> : body;
};
const Actions = ({ items }) => (
  <section className="panel">
    <div className="panel-heading"><h2>Quick Actions</h2></div>
    <div className="quick-actions">{items.map(([to, label]) => <Link key={to} className="primary-button" to={to}>{label}</Link>)}</div>
  </section>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    api("/dashboard/")
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) navigate("/login", { replace: true });
        else setError(err.message);
      });
    return () => { cancelled = true; };
  }, [navigate, isAuthenticated]);

  if (error) {
    return (<div className="inline-message inline-message--error">{error}
      <button type="button" className="inline-message-close" onClick={() => setError("")}><X size={16} /></button></div>);
  }
  if (!data) return <div className="empty-state">Loading dashboard...</div>;

  const stats = data.stats || {};
  const role = user?.role;

  return (
    <div className="dashboard-grid">
      {role === "corps_member" && (
        <>
          <section className="stat-grid">
            <Stat icon={GraduationCap} label="Enrolled courses" value={stats.approved || 0} to="/app/my-enrollments" />
            <Stat icon={Users} label="My trainers" value={stats.connections || 0} to="/app/trainers" />
          </section>
          <section className="panel">
            <div className="panel-heading"><h2><GraduationCap size={18} /> Continue learning</h2></div>
            {(data.applications || []).length === 0 ? (
              <div style={{ padding: "12px 16px" }}><p style={{ color: "var(--muted)" }}>You haven’t enrolled in a course yet.</p>
                <Link className="primary-button" to="/app/courses">Browse courses</Link></div>
            ) : (
              <div style={{ display: "grid", gap: 10, padding: "12px 16px" }}>
                {data.applications.map((a) => (
                  <Link key={a.id} to={`/app/courses/${a.program.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <strong>{a.program.title}</strong>
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${a.progressPercentage || 0}%` }} /></div>
                    <small>{a.completedLessons}/{a.totalLessons} lessons</small>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <Actions items={[["/app/courses", "Browse courses"], ["/app/incamp", "In-Camp SAED"], ["/app/my-enrollments", "My enrollments"], ["/app/trainers", "Find trainers"]]} />
        </>
      )}

      {role === "trainer" && (
        <>
          <section className="stat-grid">
            <Stat icon={BookOpen} label="My courses" value={stats.courses || 0} to="/app/my-courses" />
            <Stat icon={BookOpen} label="Lessons" value={stats.lessons || 0} />
            <Stat icon={UserCheck} label="Enrolled students" value={stats.enrolled || 0} to="/app/corps-members" />
            <Stat icon={CreditCard} label="Transfer requests" value={stats.pendingAccessRequests || 0} to="/app/my-courses" />
          </section>
          {stats.pendingAccessRequests > 0 && (
            <div className="inline-message inline-message--warning">
              {stats.pendingAccessRequests} corps member{stats.pendingAccessRequests === 1 ? " is" : "s are"} waiting for you to confirm a bank transfer and unlock a lesson. Open the course to review.
            </div>
          )}
          <Actions items={[["/app/my-courses", "Manage courses"], ["/app/incamp", "In-Camp SAED"], ["/app/corps-members", "Corps members"], ["/app/earnings", "Earnings & payout"]]} />
        </>
      )}

      {role === "saed_admin" && (
        <>
          <section className="stat-grid">
            <Stat icon={Users} label="Approved partners" value={stats.approvedTrainers || 0} />
            <Stat icon={CheckCircle2} label="Pending review" value={stats.pendingTrainers || 0} />
            <Stat icon={Users} label="Corps members" value={stats.totalCorpers || 0} />
            <Stat icon={BookOpen} label="Courses" value={stats.totalCourses || 0} />
          </section>
          <Actions items={[["/app/users", "Manage trainers"], ["/app/admin-courses", "Courses"], ["/app/manage-applications", "Enrollments"], ["/app/program-editor", "Create course"]]} />
        </>
      )}

      {role === "dunis_admin" && (
        <>
          <section className="stat-grid">
            <Stat icon={Wallet} label="Video upload revenue" value={naira(stats.videoUploadRevenue)} to="/app/dunis-admin" />
            <Stat icon={CreditCard} label="Premium lesson sales" value={naira(stats.lessonPaymentVolume)} to="/app/dunis-admin" />
            <Stat icon={CheckCircle2} label="Payments to review" value={stats.paymentsNeedingReview || 0} to="/app/dunis-admin" />
            <Stat icon={Users} label="Trainers awaiting activation" value={stats.pendingPayments || 0} to="/app/dunis-admin" />
            <Stat icon={Users} label="Approved trainers" value={stats.approvedTrainers || 0} />
            <Stat icon={Tent} label="Corps members" value={stats.totalCorpers || 0} />
          </section>
          {stats.paymentsNeedingReview > 0 && <div className="inline-message inline-message--warning">{stats.paymentsNeedingReview} payment(s) need your review in Payments &amp; Fees.</div>}
          <Actions items={[["/app/dunis-admin", "Fees & payments"], ["/app/users", "Manage trainers"], ["/app/admin-courses", "Courses"], ["/app/manage-applications", "Enrollments"]]} />
        </>
      )}
    </div>
  );
}
