import { BarChart3, BookOpen, CalendarRange, ClipboardCheck, ClipboardList, LayoutDashboard, LogOut, Menu, UserCheck, Users, X, CreditCard, Bell, ChevronRight, Tent, Wallet, UserCircle, GraduationCap } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/auth.jsx";
import DarkToggle from "../ui/DarkToggle.jsx";
import BrandLogo from "../ui/BrandLogo.jsx";
import StreamBanner from "../ui/StreamBanner.jsx";
import InstallButton from "../ui/InstallButton.jsx";
import StreamExpired from "../../pages/dashboard/StreamExpired.jsx";
import { trackOf } from "../../lib/track.js";

export default function AppShell() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api("/notifications/");
      setNotifications(data.notifications || []);
    } catch (err) {
      // 401s are handled globally by AuthProvider; silence everything here
      // so a transient network error doesn't spam the console.
    }
  }, []);

  // Refresh on navigation — only when authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated, location.pathname, fetchNotifications]);

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
      navigate("/app/inactive-account", { replace: true });
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) return <div className="empty-state">Loading...</div>;
  if (!user) return null;
  const isTrainer = user.role === "trainer";
  const isInactiveTrainer = isTrainer && (!user.isAuthorized || !user.isActive);
  const isCorpsMember = user.role === "corps_member";
  const isDunisAdmin = user.role === "dunis_admin";

  if (isInactiveTrainer) return null;

  const D = { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true };
  const N = { to: "/app/notifications", label: "Notifications", icon: Bell };
  const P = { to: "/app/profile", label: "Profile", icon: UserCircle };
  const track = trackOf(user);
  const lifecycle = user.lifecycle;
  const inCamp = track === "in_camp";
  const section = (title, items) => items.map((it, i) => (i === 0 ? { ...it, section: title } : it));
  // In-Camp and Post-Camp accounts get different, clearly labelled portals.
  const navItems = isCorpsMember
    ? (inCamp
      ? [D,
         { to: "/app/incamp", label: "In-Camp SAED", icon: Tent },
         { to: "/app/my-enrollments", label: "My Learning", icon: GraduationCap },
         P, N]
      : [D,
         { to: "/app/courses", label: "Courses", icon: BookOpen },
         { to: "/app/my-enrollments", label: "My Enrollments", icon: GraduationCap },
         { to: "/app/trainers", label: "Trainers", icon: Users },
         P, N])
    : isTrainer
    ? (inCamp
      ? [D,
         { to: "/app/incamp", label: "In-Camp Courses", icon: Tent },
         { to: "/app/my-courses", label: "My Proposals", icon: ClipboardCheck },
         { to: "/app/corps-members", label: "Learners", icon: UserCheck },
         P, N]
      : [D,
         { to: "/app/my-courses", label: "My Courses", icon: BookOpen },
         { to: "/app/corps-members", label: "Corps Members", icon: UserCheck },
         { to: "/app/earnings", label: "Earnings", icon: Wallet },
         P, N])
    : [D,
       ...section("In-Camp SAED", [
         { to: "/app/streams", label: "Streams", icon: CalendarRange },
         { to: "/app/stream-trainers", label: "In-Camp Trainers", icon: UserCheck },
         { to: "/app/proposals", label: "Proposals", icon: ClipboardCheck },
         { to: "/app/camps", label: "SAED Camps", icon: Tent },
         { to: "/app/reports", label: "Reports", icon: BarChart3 }]),
       ...section("Post-Camp SAED", [
         { to: "/app/admin-courses", label: "Courses", icon: BookOpen },
         { to: "/app/manage-applications", label: "Enrollments", icon: ClipboardList }]),
       ...section("Platform", [
         { to: "/app/users", label: "Users", icon: Users },
         ...(isDunisAdmin ? [{ to: "/app/dunis-admin", label: "Payments & Fees", icon: CreditCard }] : [])]),
       P, N];
  const stateOnly = ["/app/profile", "/app/edit-profile", "/app/notifications"];
  const showExpired = inCamp && lifecycle && !lifecycle.isActive && !stateOnly.some((p) => location.pathname.startsWith(p));

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
          <BrandLogo size={44} />
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
          {navItems.map(({ to, label, icon: Icon, end, section: heading }) => (
            <div key={to} className="nav-item-wrap">
              {heading && <span className="nav-section">{heading}</span>}
              <NavLink to={to} end={end} onClick={closeNav}>
                <Icon size={18} /> {label}
              </NavLink>
            </div>
          ))}
        </nav>
        <InstallButton className="install-button--sidebar" />
        <button className="ghost-button logout-button" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="app-main">
        <header className="app-header">
          <div>
            <span className="eyebrow">
              {user.role?.replace("_", " ")}
              {track && <span className={`track-chip track-chip--${inCamp ? "in" : "post"}`}>{inCamp ? "In-Camp" : "Post-Camp"}</span>}
            </span>
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
                      <div key={n.id} className={`notification-item ${n.isRead ? "read" : "unread"}`} onClick={() => { markRead(n.id); if (n.link) { setShowNotifications(false); navigate(n.link.replace(/^https?:\/\/[^/]+/, "")); } }}>
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
        {inCamp && !showExpired && location.pathname !== "/app/dashboard" && <StreamBanner lifecycle={lifecycle} />}
        {showExpired ? <StreamExpired lifecycle={lifecycle} role={user.role} /> : <Outlet />}
      </main>
    </div>
  );
}

