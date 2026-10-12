import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle, XCircle, Bell, UserCheck, AlertTriangle, X } from "lucide-react";
import { api } from "./api.js";
import { useAuth } from "./auth.jsx";

const RealtimeContext = createContext(null);

const BROADCAST_CHANNEL_NAME = "saed_realtime_bus";
const ACTIVE_SYNC_INTERVAL = 3500;   // 3.5s when tab is in foreground
const IDLE_SYNC_INTERVAL = 25000;    // 25s when tab is in background

export function RealtimeProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [connections, setConnections] = useState([]);
  const [connectionsMap, setConnectionsMap] = useState({});
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);
  const [activeConnectionsCount, setActiveConnectionsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState([]);
  const [adminStats, setAdminStats] = useState({});
  const [profileLive, setProfileLive] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLive, setIsLive] = useState(false);

  // References to track previous state for change detection
  const prevConnectionsMapRef = useRef(null);
  const prevTrainerPendingCountRef = useRef(null);
  const prevSeenNotificationIdsRef = useRef(new Set());
  const prevIsAuthorizedRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const isInitialSyncRef = useRef(true);
  const listenersRef = useRef(new Set());
  const recentToastKeysRef = useRef(new Map());

  // Helper to add toast alert with deduplication and 4s fade-out lifecycle
  const addToast = useCallback((toast) => {
    const normalizedKey = (
      toast.dedupKey ||
      `${(toast.title || "").trim().toLowerCase()}_${(toast.message || "").trim().toLowerCase()}`
    );
    const now = Date.now();
    const lastSeen = recentToastKeysRef.current.get(normalizedKey);
    if (lastSeen && now - lastSeen < 8000) {
      // Duplicate alert within 8 seconds window, suppress
      return;
    }
    recentToastKeysRef.current.set(normalizedKey, now);

    // Garbage-collect old keys
    if (recentToastKeysRef.current.size > 50) {
      for (const [k, time] of recentToastKeysRef.current.entries()) {
        if (now - time > 15000) recentToastKeysRef.current.delete(k);
      }
    }

    const id = now + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev.slice(-3), { ...toast, id, isExiting: false }]);

    // Phase 1: At 4.0s (4000ms), start the smooth fade-out exit transition
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 4000);

    // Phase 2: At 4.4s (4400ms), unmount toast from state after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4400);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  // Event emission to local subscribers
  const emit = useCallback((eventType, data) => {
    listenersRef.current.forEach((listener) => {
      try {
        listener(eventType, data);
      } catch (err) {
        console.error("Realtime listener error:", err);
      }
    });
  }, []);

  const subscribe = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  // Core Harmonized Sync Fetch
  const sync = useCallback(async (isManualTrigger = false) => {
    if (!isAuthenticated) return;
    try {
      const data = await api("/realtime/sync/");
      if (!data) return;

      setIsLive(true);
      const isFirst = isInitialSyncRef.current;
      const handledEventTopics = new Set();

      // 1. Corps Member Connection Changes (Entity Level)
      if (data.role === "corps_member") {
        const nextMap = data.connectionsMap || {};
        const nextList = data.connections || [];
        setConnections(nextList);
        setConnectionsMap(nextMap);

        if (!isFirst && prevConnectionsMapRef.current) {
          const prevMap = prevConnectionsMapRef.current;
          nextList.forEach((c) => {
            const trainerId = c.trainer?.id;
            const prevStatus = prevMap[trainerId];
            const currentStatus = c.status;

            if (prevStatus === "pending" && currentStatus === "active") {
              handledEventTopics.add("connection_approved");
              addToast({
                title: "Connection Approved!",
                message: `Your connection request with ${c.trainer?.fullName || "your trainer"} was approved.`,
                type: "success",
                icon: "check",
                dedupKey: `conn_approved_${trainerId}`,
              });
              emit("connection:approved", c);
            } else if (prevStatus === "pending" && currentStatus === "cancelled") {
              handledEventTopics.add("connection_declined");
              addToast({
                title: "Connection Declined",
                message: `Your connection request with ${c.trainer?.fullName || "the trainer"} was declined.`,
                type: "error",
                icon: "x",
                dedupKey: `conn_declined_${trainerId}`,
              });
              emit("connection:declined", c);
            }
          });
        }
        prevConnectionsMapRef.current = nextMap;
      }

      // 2. Trainer Connection Changes (Entity Level)
      if (data.role === "trainer") {
        const nextList = data.connections || [];
        setConnections(nextList);
        setPendingConnectionsCount(data.pendingConnectionsCount || 0);
        setActiveConnectionsCount(data.activeConnectionsCount || 0);

        if (!isFirst && prevTrainerPendingCountRef.current !== null) {
          if (data.pendingConnectionsCount > prevTrainerPendingCountRef.current) {
            handledEventTopics.add("connection_request");
            const newConn = nextList.find((c) => c.status === "pending");
            addToast({
              title: "New Connection Request",
              message: newConn?.corpsMember?.fullName
                ? `${newConn.corpsMember.fullName} wants to connect with you.`
                : "You have a new corps member connection request.",
              type: "info",
              icon: "user",
              dedupKey: `conn_request_${newConn?.id || data.pendingConnectionsCount}`,
            });
            emit("connection:received", newConn);
          }
        }
        prevTrainerPendingCountRef.current = data.pendingConnectionsCount || 0;
      }

      // 3. Profile Changes (Trainer Authorization & Status)
      if (data.profile) {
        setProfileLive(data.profile);
        if (!isFirst && prevIsAuthorizedRef.current !== null) {
          if (!prevIsAuthorizedRef.current && data.profile.isAuthorized) {
            handledEventTopics.add("profile_authorized");
            addToast({
              title: "Account Authorized!",
              message: "Your trainer account has been authorized. Full dashboard access is now active.",
              type: "success",
              icon: "check",
              dedupKey: "trainer_authorized",
            });
            emit("profile:authorized", data.profile);
          } else if (prevIsAuthorizedRef.current && !data.profile.isAuthorized) {
            handledEventTopics.add("profile_deauthorized");
            addToast({
              title: "Account Status Update",
              message: "Your account authorization status has been modified.",
              type: "warning",
              icon: "alert",
              dedupKey: "trainer_deauthorized",
            });
            emit("profile:deauthorized", data.profile);
          }
        }
        prevIsAuthorizedRef.current = data.profile.isAuthorized;
      }

      // 4. Harmonized Notifications Engine
      if (typeof data.unreadNotificationsCount === "number") {
        setUnreadNotificationsCount(data.unreadNotificationsCount);
      }
      if (Array.isArray(data.latestNotifications)) {
        setLatestNotifications(data.latestNotifications);

        if (!isFirst && data.latestNotifications.length > 0) {
          data.latestNotifications.forEach((n) => {
            if (prevSeenNotificationIdsRef.current.has(n.id) || n.isRead) {
              return;
            }

            const reason = n.reason || "";
            const lowerTitle = (n.title || "").toLowerCase();

            // Detect whether this notification belongs to an event already surfaced by domain entities
            const isConnApproved = reason === "connection_approved" || lowerTitle.includes("connection approved");
            const isConnDeclined = reason === "connection_declined" || lowerTitle.includes("connection declined") || lowerTitle.includes("connection request declined");
            const isConnRequest = reason === "connection_request" || lowerTitle.includes("connection request");
            const isProfileAuth = reason === "trainer_approved" || lowerTitle.includes("account approved") || lowerTitle.includes("account activated");

            if (
              (isConnApproved && handledEventTopics.has("connection_approved")) ||
              (isConnDeclined && handledEventTopics.has("connection_declined")) ||
              (isConnRequest && handledEventTopics.has("connection_request")) ||
              (isProfileAuth && handledEventTopics.has("profile_authorized"))
            ) {
              // Unified: already surfaced as a primary rich toast
              return;
            }

            // Stylize remaining notifications based on their semantic domain
            let type = "info";
            let icon = "bell";
            let dedupKey = `notif_${n.id}`;

            if (isConnApproved) {
              type = "success";
              icon = "check";
              dedupKey = "notif_conn_approved";
            } else if (isConnDeclined) {
              type = "error";
              icon = "x";
              dedupKey = "notif_conn_declined";
            } else if (isConnRequest) {
              type = "info";
              icon = "user";
              dedupKey = "notif_conn_request";
            } else if (isProfileAuth) {
              type = "success";
              icon = "check";
              dedupKey = "notif_profile_auth";
            } else if (reason === "course_restricted" || lowerTitle.includes("restricted")) {
              type = "warning";
              icon = "alert";
              dedupKey = `course_restricted_${lowerTitle.replace(/\s+/g, '_')}`;
            } else if (reason === "course_unrestricted" || lowerTitle.includes("unrestricted")) {
              type = "success";
              icon = "check";
              dedupKey = `course_unrestricted_${lowerTitle.replace(/\s+/g, '_')}`;
            } else if (lowerTitle.includes("payment") || lowerTitle.includes("paid")) {
              type = "success";
              icon = "check";
              dedupKey = `payment_${lowerTitle.replace(/\s+/g, '_')}`;
            } else if (lowerTitle.includes("enrollment")) {
              type = "info";
              icon = "user";
              dedupKey = `enrollment_${lowerTitle.replace(/\s+/g, '_')}`;
            }

            addToast({
              title: n.title,
              message: n.message,
              type,
              icon,
              dedupKey,
            });
            emit("notification:new", n);
          });
        }

        // Record all seen notification IDs
        data.latestNotifications.forEach((n) => {
          prevSeenNotificationIdsRef.current.add(n.id);
        });
      }

      // 5. Admin Stats
      if (data.adminStats) {
        setAdminStats(data.adminStats);
        emit("adminStats:updated", data.adminStats);
      }

      if (isFirst) {
        isInitialSyncRef.current = false;
      }

      // If this was a manual trigger from user action, broadcast to other tabs
      if (isManualTrigger && broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({ type: "SYNC_EVENT", role: data.role });
        } catch (e) {
          // BroadcastChannel unsupported or closed
        }
      }
    } catch (err) {
      // Gracefully handle network drops without spamming
      setIsLive(false);
    }
  }, [isAuthenticated, addToast, emit]);

  // Manual trigger to immediately sync without waiting for interval
  const triggerSync = useCallback(() => {
    sync(true);
  }, [sync]);

  // Initialize BroadcastChannel and Polling
  useEffect(() => {
    if (!isAuthenticated) {
      isInitialSyncRef.current = true;
      prevConnectionsMapRef.current = null;
      prevTrainerPendingCountRef.current = null;
      prevSeenNotificationIdsRef.current.clear();
      setIsLive(false);
      return;
    }

    // Set up BroadcastChannel for instant cross-tab sync
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannelRef.current = bc;
        bc.onmessage = (msg) => {
          if (msg.data?.type === "SYNC_EVENT") {
            sync(false);
          }
        };
      } catch (e) {
        // BroadcastChannel unavailable
      }
    }

    // Initial sync
    sync(false);

    // Dynamic timer based on page visibility
    let timerId = null;
    function scheduleNext() {
      const isHidden = typeof document !== "undefined" && document.hidden;
      const interval = isHidden ? IDLE_SYNC_INTERVAL : ACTIVE_SYNC_INTERVAL;
      timerId = setTimeout(() => {
        sync(false).finally(() => {
          scheduleNext();
        });
      }, interval);
    }
    scheduleNext();

    // Event listeners for window focus / visibility change
    function handleVisibility() {
      if (!document.hidden) {
        sync(false);
      }
    }
    function handleFocus() {
      sync(false);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [isAuthenticated, sync]);

  return (
    <RealtimeContext.Provider
      value={{
        connections,
        connectionsMap,
        pendingConnectionsCount,
        activeConnectionsCount,
        unreadNotificationsCount,
        latestNotifications,
        adminStats,
        profileLive,
        isLive,
        triggerSync,
        subscribe,
      }}
    >
      {children}

      {/* Floating Live Toasts */}
      {toasts.length > 0 && (
        <div className="realtime-toast-container" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`realtime-toast realtime-toast--${toast.type || "info"} ${toast.isExiting ? "is-exiting" : ""}`}
            >
              <div className="realtime-toast-icon">
                {toast.type === "success" || toast.icon === "check" ? (
                  <CheckCircle size={20} className="toast-icon-svg toast-icon-svg--success" />
                ) : toast.type === "error" || toast.icon === "x" ? (
                  <XCircle size={20} className="toast-icon-svg toast-icon-svg--error" />
                ) : toast.type === "warning" || toast.icon === "alert" ? (
                  <AlertTriangle size={20} className="toast-icon-svg toast-icon-svg--warning" />
                ) : toast.icon === "user" ? (
                  <UserCheck size={20} className="toast-icon-svg toast-icon-svg--info" />
                ) : (
                  <Bell size={20} className="toast-icon-svg toast-icon-svg--info" />
                )}
              </div>
              <div className="realtime-toast-body">
                <div className="realtime-toast-title">{toast.title}</div>
                <div className="realtime-toast-message">{toast.message}</div>
              </div>
              <button
                type="button"
                className="realtime-toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    return {
      connections: [],
      connectionsMap: {},
      pendingConnectionsCount: 0,
      activeConnectionsCount: 0,
      unreadNotificationsCount: 0,
      latestNotifications: [],
      adminStats: {},
      profileLive: null,
      isLive: false,
      triggerSync: () => {},
      subscribe: () => () => {},
    };
  }
  return context;
}
