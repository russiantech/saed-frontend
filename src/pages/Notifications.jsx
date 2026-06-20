import { Bell, X, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messageType, setMessageType] = useState("");

  function showMsg(text, type) {
    setError(text);
    setMessageType(type || "");
  }

  function load() {
    api("/notifications/")
      .then((d) => setNotifications(d.notifications || []))
      .catch((err) => {
        if (err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        showMsg(err.message, "error");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <div className="empty-state">Loading notifications...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><Bell size={24} /> Notifications</h1>
          <p>All your notifications in one place</p>
        </div>
        {unreadCount > 0 && (
          <button className="primary-button" onClick={markAllRead} type="button">
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          {error}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}><X size={16} /></button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} style={{ opacity: 0.3 }} />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="notification-page-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-page-item ${n.isRead ? "read" : "unread"}`}
              onClick={() => markRead(n.id)}
            >
              <div className="notification-page-content">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              {!n.isRead && <span className="notification-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
