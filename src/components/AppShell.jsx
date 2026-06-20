import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, UserCheck, Users, X, Video, CreditCard, Bell, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import DarkToggle from "./DarkToggle.jsx";

export default function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  function fetchNotifications() {
    api("/notifications/").then((data) => setNotifications(data.notifications || [])).catch(() => {});
  }

  useEffect(() => { fetchNotifications(); }, []);
  useEffect(() => { fetchNotifications(); }, [location.pathname]);

  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 0);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (user && user.role === "trainer" && (!user.isAuthorized || !user.isActive)) {
      navigate("/inactive-account", { replace: true });
    }
  }, [user, navigate]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function toggleNotifications() {
    setShowNotifications((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  }

  async function markRead(id) {
    try {
      await api(`/notifications/${id}/read/`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await api("/notifications/read-all/", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

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
    navigate("/");
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
          <NavLink to="/app" end onClick={closeNav}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {isCorpsMember && (
            <NavLink to="/app/programs" onClick={closeNav}>
              <BookOpen size={18} /> Programs
            </NavLink>
          )}
          {isCorpsMember && (
            <NavLink to="/app/applications" onClick={closeNav}>
              <ClipboardList size={18} /> My Applications
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
              <ClipboardList size={18} /> Applications
            </NavLink>
          )}
          {isTrainer && user.canUploadFastTrack && (
            <NavLink to="/app/fast-track-videos" onClick={closeNav}>
              <Video size={18} /> Fast Track Courses
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/app/users" onClick={closeNav}>
              <Users size={18} /> Trainers
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/app/program-editor" onClick={closeNav}>
              <Settings size={18} /> Programs
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
            <div ref={bellRef} style={{ position: "relative" }}>
              <div className="notification-bell" onClick={toggleNotifications}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
              {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <div className="notification-empty">No notifications</div>
                ) : (
                  <>
                    {unreadCount > 0 && (
                      <div className="notification-mark-all" onClick={markAllRead}>Mark all as read</div>
                    )}
                    {notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className={`notification-item ${n.isRead ? "read" : "unread"}`} onClick={() => markRead(n.id)}>
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <span className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                    <div className="notification-show-all" onClick={() => { setShowNotifications(false); navigate("/app/notifications"); }}>
                      Show all <ChevronRight size={14} />
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
            <DarkToggle />
            <div className="profile-pill">{user.stateOfDeployment || "SAED IMS"}</div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
