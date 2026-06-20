import { CreditCard, ShieldCheck, CheckCircle, X, Video, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api.js";

export default function DunisAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [pendingPayments, setPendingPayments] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type);
  }

  async function load() {
    try {
      const [dashData, payData, trainerData] = await Promise.all([
        api("/dashboard/"),
        api("/dunis/pending-payments/"),
        api("/dunis/trainers/"),
      ]);
      setStats(dashData.stats || {});
      setPendingPayments(payData.trainers || []);
      setAllTrainers(trainerData.trainers || []);
    } catch (err) {
      if (err.status === 401) navigate("/login", { replace: true });
      else showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [navigate]);

  async function confirmPayment(trainer) {
    setConfirmingId(trainer.id);
    setMessage("");
    try {
      await api("/dunis/confirm-payment/", {
        method: "POST",
        body: { userId: trainer.id, reference: trainer.paymentReference || `MANUAL-${Date.now()}` },
      });
      showMsg(`${trainer.fullName} activation fee confirmed. Account activated.`, "success");
      await load();
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setConfirmingId(null);
    }
  }

  async function toggleFastTrack(trainer) {
    setMessage("");
    try {
      await api(`/dunis/toggle-fast-track/${trainer.id}/`, {
        method: "PATCH",
        body: { canUploadFastTrack: !trainer.canUploadFastTrack },
      });
      showMsg(`${trainer.fullName}: Fast track ${trainer.canUploadFastTrack ? "disabled" : "enabled"}.`, "success");
      await load();
    } catch (err) {
      showMsg(err.message, "error");
    }
  }

  if (loading) return <div className="empty-state">Loading...</div>;

  const tabs = [
    { key: "overview", label: "Overview", icon: <Settings size={14} /> },
    { key: "payments", label: `Activation Fee (${pendingPayments.length})`, icon: <CreditCard size={14} /> },
    { key: "fasttrack", label: "Fast Track", icon: <Video size={14} /> },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dunis Admin Dashboard</h1>
        <p>Full administrative access to the SAED IMS platform</p>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType || "error"}`}>
          <span>{message}</span>
          <button className="inline-message-close" onClick={() => setMessage("")}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="filter-tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`filter-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="stat-grid">
          <article className="stat-card">
            <Users size={22} />
            <span>Total Trainers</span>
            <strong>{stats.totalTrainers || 0}</strong>
          </article>
          <Link to="/app/dunis-admin" className="stat-card" onClick={() => setTab("payments")}>
            <CreditCard size={22} />
            <span>Pending Activation Fee</span>
            <strong>{stats.pendingPayments || 0}</strong>
          </Link>
          <article className="stat-card">
            <CheckCircle size={22} />
            <span>Approved Trainers</span>
            <strong>{stats.approvedTrainers || 0}</strong>
          </article>
          <article className="stat-card">
            <ShieldCheck size={22} />
            <span>Activated Trainers</span>
            <strong>{stats.paidTrainers || 0}</strong>
          </article>
          <Link to="/app/dunis-admin" className="stat-card" onClick={() => setTab("fasttrack")}>
            <Video size={22} />
            <span>Fast Track Enabled</span>
            <strong>{stats.fastTrackEnabled || 0}</strong>
          </Link>
        </div>
      )}

      {tab === "payments" && (
        <div className="panel">
          <div className="panel-heading"><h2>Trainers Awaiting Activation Fee</h2></div>
          {pendingPayments.length === 0 ? (
            <div className="empty-state"><p>No pending activation fees.</p></div>
          ) : (
            <div className="trainer-list">
              {pendingPayments.map((t) => (
                <div key={t.id} className="trainer-admin-card">
                  <div className="trainer-admin-info">
                    <div className="dunis-record-avatar">
                      {t.profilePicture ? (
                        <img src={t.profilePicture} alt={t.fullName} />
                      ) : (
                        t.fullName?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="dunis-record-details">
                      <strong>{t.fullName}</strong>
                      <span>{t.email}</span>
                      <div className="dunis-record-meta">
                        <span className="status-pill status-pending">{t.specialization || "Unspecified"}</span>
                        <span>Authorized: {t.authorizedAt ? new Date(t.authorizedAt).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="dunis-confirm-btn"
                    disabled={confirmingId === t.id}
                    onClick={() => confirmPayment(t)}
                  >
                    <CheckCircle size={16} />
                    {confirmingId === t.id ? "Confirming..." : "Confirm Activation"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="panel-heading" style={{ marginTop: 24 }}><h2>Paid Trainers</h2></div>
          {allTrainers.filter((t) => t.paymentVerified).length === 0 ? (
            <div className="empty-state"><p>No paid trainers yet.</p></div>
          ) : (
            <div className="trainer-list">
              {allTrainers.filter((t) => t.paymentVerified).map((t) => (
                <div key={t.id} className="trainer-admin-card">
                  <div className="trainer-admin-info">
                    <div className="dunis-record-avatar">
                      {t.profilePicture ? (
                        <img src={t.profilePicture} alt={t.fullName} />
                      ) : (
                        t.fullName?.charAt(0) || "?"
                      )}
                    </div>
                    <div className="dunis-record-details">
                      <strong>{t.fullName}</strong>
                      <span>{t.email}</span>
                      <div className="dunis-record-meta">
                        <span className="status-pill">{t.specialization || "Unspecified"}</span>
                        <span className="status-pill status-approved">Paid</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "fasttrack" && (
        <div className="panel">
          <div className="panel-heading"><h2>Fast Track Course Permissions</h2></div>
          <div className="trainer-list">
            {allTrainers.filter((t) => t.isAuthorized).map((t) => (
              <div key={t.id} className="trainer-admin-card">
                <div className="trainer-admin-info">
                  <div className="dunis-record-avatar">
                    {t.profilePicture ? (
                      <img src={t.profilePicture} alt={t.fullName} />
                    ) : (
                      t.fullName?.charAt(0) || "?"
                    )}
                  </div>
                  <div className="dunis-record-details">
                    <strong>{t.fullName}</strong>
                    <span>{t.email}</span>
                    <div className="dunis-record-meta">
                      <span className="status-pill">{t.specialization || "Unspecified"}</span>
                      <span>Payment: {t.paymentVerified ? <span className="status-pill status-approved">Verified</span> : <span className="status-pill status-pending">Pending</span>}</span>
                    </div>
                  </div>
                </div>
                <button
                  className={`dunis-toggle-btn ${t.canUploadFastTrack ? "enabled" : "disabled"}`}
                  onClick={() => toggleFastTrack(t)}
                >
                  {t.canUploadFastTrack ? <><CheckCircle size={16} /> <span>Enabled</span></> : <><X size={16} /> <span>Disabled</span></>}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
