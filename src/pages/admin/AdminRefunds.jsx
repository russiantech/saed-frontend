import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../../lib/api.js";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [actionId, setActionId] = useState(null);
  const [note, setNote] = useState("");

  function showMsg(text, type) {
    setMessage(text);
    setMessageType(type || "");
  }

  async function load() {
    try {
      const data = await api("/admin/refunds/pending/");
      setRefunds(data.refunds || []);
    } catch (err) {
      showMsg(err.message || "Failed to load refunds", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleProcess(enrollmentId) {
    setActionId(enrollmentId);
    try {
      await api(`/admin/refunds/${enrollmentId}/process/`, {
        method: "POST",
        body: { note },
      });
      setNote("");
      await load();
      showMsg("Refund processed successfully.", "success");
    } catch (err) {
      showMsg(err.message || "Failed to process refund", "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(enrollmentId) {
    setActionId(enrollmentId);
    try {
      await api(`/admin/refunds/${enrollmentId}/reject/`, {
        method: "POST",
        body: { note: note || "Refund denied by admin" },
      });
      setNote("");
      await load();
      showMsg("Refund denied.", "success");
    } catch (err) {
      showMsg(err.message || "Failed to reject refund", "error");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="page-container"><p>Loading refunds...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pending Refunds</h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 14 }}>
            Review and process refund requests from trainers.
          </p>
        </div>
      </div>

      {message && (
        <div className={`inline-message inline-message--${messageType}`} style={{ marginBottom: 16 }}>
          {message}
          <button type="button" className="inline-message-close" onClick={() => showMsg("")}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {refunds.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={40} style={{ color: "var(--success)", opacity: 0.5 }} />
          <p>No pending refund requests.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Trainer</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.studentName}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.studentEmail}</div>
                  </td>
                  <td>{r.courseTitle}</td>
                  <td>{r.trainerName}</td>
                  <td style={{ fontWeight: 600 }}>₦{Number(r.amount).toLocaleString()}</td>
                  <td><code style={{ fontSize: 12 }}>{r.paymentReference}</code></td>
                  <td style={{ fontSize: 13 }}>{r.refundRequestedAt ? new Date(r.refundRequestedAt).toLocaleDateString() : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={actionId === r.id ? note : ""}
                        onChange={(e) => { setActionId(r.id); setNote(e.target.value); }}
                        style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, width: 120 }}
                      />
                      <button
                        className="primary-button"
                        style={{ minHeight: 32, padding: "0 12px", fontSize: 12, background: "var(--success)" }}
                        disabled={actionId === r.id}
                        onClick={() => handleProcess(r.id)}
                      >
                        <CheckCircle size={14} /> Process
                      </button>
                      <button
                        className="outline-button"
                        style={{ minHeight: 32, padding: "0 12px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
                        disabled={actionId === r.id}
                        onClick={() => handleReject(r.id)}
                      >
                        <XCircle size={14} /> Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
