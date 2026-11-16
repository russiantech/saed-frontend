import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "lib/api.js";
import "styles/trainer.css";

export default function CorpsMembers() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => { api("/trainer/corpers/").then((d) => setRows(d.corpers || [])).catch((e) => setError(e.message)); }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows || []).filter((c) => !t || c.corpsMember.fullName.toLowerCase().includes(t) || c.corpsMember.email.toLowerCase().includes(t));
  }, [rows, q]);

  async function decide(c, kind) {
    setBusy(c.id);
    try { await api(`/connections/${c.id}/${kind}/`, { method: "POST" }); setRows((r) => r.map((x) => x.id === c.id ? { ...x, status: kind === "approve" ? "active" : "cancelled" } : x)); }
    catch (e) { setError(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="tr-page">
      <div className="tr-head"><h2>Corps Members</h2>
        <input type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search corps members" /></div>
      {error && <div className="inline-message inline-message--error">{error}</div>}
      {!rows ? <div className="empty-state">Loading…</div> : shown.length === 0 ? (
        <div className="empty-state"><h3>No corps members yet</h3><p>Corps members are connected to you automatically when they enrol in one of your courses.</p></div>
      ) : shown.map((c) => (
        <div key={c.id} className="tr-row">
          <div className="tr-row-main"><strong><Link to={`/app/corps-members/${c.corpsMember.id}`}>{c.corpsMember.fullName}</Link></strong>
            <small>{c.corpsMember.email} · connected {new Date(c.connectedAt).toLocaleDateString()}</small></div>
          <div className="tr-actions">
            <span className={`tr-badge ${c.status === "active" ? "tr-badge--ok" : ""}`}>{c.status}</span>
            {c.status === "pending" && <>
              <button className="primary-button" disabled={busy === c.id} onClick={() => decide(c, "approve")}>Approve</button>
              <button className="ghost-button" disabled={busy === c.id} onClick={() => decide(c, "reject")}>Decline</button>
            </>}
          </div>
        </div>
      ))}
    </div>
  );
}
