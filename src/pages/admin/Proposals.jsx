import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "lib/api.js";
import useStreams from "hooks/useStreams.js";
import "styles/trainer.css";

const STATUS = { pending: ["Pending review", "cp-badge--warn"], approved: ["Open", "cp-badge--ok"], declined: ["Declined", ""] };

/** SAED admin: trainers propose what they will teach in a stream; admin opens (approves) or declines it. */
export default function Proposals() {
  const { streams } = useStreams();
  const [streamId, setStreamId] = useState("");
  const [approval, setApproval] = useState("pending");
  const [rows, setRows] = useState(null);
  const [decline, setDecline] = useState(null);   // { course, note }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ courseType: "in_camp", pageSize: "100" });
    if (streamId) qs.set("streamId", streamId);
    if (approval) qs.set("approval", approval);
    try { setRows((await api(`/admin/courses/?${qs}`)).courses || []); }
    catch (e) { setError(e.message); setRows([]); }
  }, [streamId, approval]);
  useEffect(() => { load(); }, [load]);

  async function review(course, decision, note = "") {
    setBusy(true); setError("");
    try {
      await api(`/manage/courses/${course.id}/review/`, { method: "POST", body: { decision, note } });
      setNotice(decision === "approve" ? `“${course.title}” is now open to corps members.` : `“${course.title}” was declined.`);
      setDecline(null);
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="panel tr-section">
      <div className="tr-head">
        <div>
          <h2>In-Camp proposals</h2>
          <p className="form-hint">Trainers submit what they want to teach for a stream. Opening a proposal publishes it to that stream’s corps members.</p>
        </div>
      </div>
      <div className="tr-filters">
        <label>Stream
          <select value={streamId} onChange={(e) => setStreamId(e.target.value)} aria-label="Filter by stream">
            <option value="">All streams</option>
            {(streams || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>Status
          <select value={approval} onChange={(e) => setApproval(e.target.value)} aria-label="Filter by status">
            <option value="">All</option><option value="pending">Pending review</option>
            <option value="approved">Open</option><option value="declined">Declined</option>
          </select>
        </label>
      </div>

      {notice && <p className="inline-message success" role="status">{notice}</p>}
      {error && !decline && <p className="inline-message error" role="alert">{error}</p>}

      {rows === null ? <p className="form-hint">Loading…</p> : rows.length === 0 ? (
        <div className="empty-state"><h3>No proposals here</h3><p>{approval === "pending" ? "Nothing is waiting for review." : "No In-Camp courses match these filters."}</p></div>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead><tr><th>Course</th><th>Trainer</th><th>Stream</th><th>Skill</th><th>Lessons</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {rows.map((c) => {
                const [label, cls] = STATUS[c.approvalStatus] || [c.approvalStatus, ""];
                return (
                  <tr key={c.id}>
                    <td><Link to={`/app/courses/${c.id}`}><strong>{c.title}</strong></Link>
                      {c.reviewNote && <><br /><small className="form-hint">Note: {c.reviewNote}</small></>}</td>
                    <td>{c.trainer?.fullName || "—"}</td>
                    <td>{c.stream?.name || "—"}</td>
                    <td>{c.categoryLabel || c.category}</td>
                    <td>{c.lessonCount ?? 0}</td>
                    <td><span className={`cp-badge ${cls}`}>{label}</span></td>
                    <td>
                      <div className="tr-actions">
                        {c.approvalStatus !== "approved" && <button type="button" className="primary-button small" disabled={busy} onClick={() => review(c, "approve")}><Check size={14} /> Open</button>}
                        {c.approvalStatus !== "declined" && <button type="button" className="ghost-button small" disabled={busy} onClick={() => { setError(""); setDecline({ course: c, note: "" }); }}><X size={14} /> Decline</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {decline && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label="Decline proposal" onClick={() => !busy && setDecline(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Decline “{decline.course.title}”</h3>
            <form className="tr-form" style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); review(decline.course, "decline", decline.note); }}>
              <label>Reason for the trainer *
                <textarea rows={3} required maxLength={500} value={decline.note} onChange={(e) => setDecline((d) => ({ ...d, note: e.target.value }))} />
              </label>
              {error && <p className="field-error" role="alert">{error}</p>}
              <div className="tr-actions" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="ghost-button" onClick={() => setDecline(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="danger-button" disabled={busy || !decline.note.trim()}>Decline proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
