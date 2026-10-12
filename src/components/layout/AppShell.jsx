import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, UserCheck, Users, X, Video, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../lib/auth.jsx";
import DarkToggle from "../ui/DarkToggle.jsx";

export default function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === "trainer" && (!user.isAuthorized || !user.isActive)) {
      navigate("/app/inactive-account", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) return <div className="empty-state">Loading...</div>;
  if (!user) return null;

  const isAdmin = user.role === "saed_admin" || user.role === "dunis_admin";
  const isTrainer = user.role === "trainer";
  const isInactiveTrainer = isTrainer && (!user.isAuthorized || !user.isActive);
  const isCorpsMember = user.role === "corps_member";
  const isDunisAdmin = user.role === "dunis_admin";

  if (isInactiveTrainer) return null;

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore
    }
    setNavOpen(false);
    navigate("/login", { replace: true });
  }

  function closeNav() {
    setNavOpen(false);
  }

  return (
    <div className="app-layout">
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="brand-mark">
          <img src="/nysc.png" alt="NYSC" className="brand-logo brand-logo-light" />
          <img src="/nysc-dark.png" alt="NYSC" className="brand-logo brand-logo-dark" />
          <div>
            <strong>NYSC SAED</strong>
            <span>Information Management</span>
          </div>
        </div>
        <button
          className="app-menu-toggle"
          onClick={() => setNavOpen((current) => !current)}
          type="button"
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navOpen}
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav>
          <NavLink to="/app/dashboard" end onClick={closeNav}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {isCorpsMember && (
            <NavLink to="/app/programs" onClick={closeNav}>
              <BookOpen size={18} /> Courses
            </NavLink>
          )}
          {isCorpsMember && (
            <NavLink to="/app/applications" onClick={closeNav}>
              <ClipboardList size={18} /> My Enrollments
            </NavLink>
          )}
          {isCorpsMember && (
            <NavLink to="/app/my-trainers" onClick={closeNav}>
              <Users size={18} /> Trainers
            </NavLink>
          )}
          {isCorpsMember && (
            <NavLink to="/app/trainee-fast-track" onClick={closeNav}>
              <Video size={18} /> Fast Track
            </NavLink>
          )}

          {isTrainer && (
            <NavLink to="/app/course-management" onClick={closeNav}>
              <BookOpen size={18} /> My Courses
            </NavLink>
          )}
          {isTrainer && (
            <NavLink to="/app/my-corpers" onClick={closeNav}>
              <UserCheck size={18} /> My Corpers
            </NavLink>
          )}
          {isTrainer && (
            <NavLink to="/app/manage-applications" onClick={closeNav}>
              <ClipboardList size={18} /> Enrollments
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/app/users" onClick={closeNav}>
              <Users size={18} /> Trainers
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/app/program-editor" onClick={closeNav}>
              <Settings size={18} /> Courses
            </NavLink>
          )}

          {isDunisAdmin && (
            <NavLink to="/app/dunis-admin" onClick={closeNav}>
              <CreditCard size={18} /> Payments & Fast Track
            </NavLink>
          )}
        </nav>
        <button className="ghost-button logout-button" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div>
            <span className="eyebrow">{user.role?.replace("_", " ")}</span>
            <h1>Welcome, {user.fullName}</h1>
          </div>
          <div className="app-header-actions">
            <DarkToggle />
            <div className="profile-pill">{user.stateOfDeployment || "SAED IMS"}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

