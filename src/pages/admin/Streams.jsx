import { useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";

import { api } from "lib/api.js";
import { fmtDate, STREAM_STATUS_LABEL } from "lib/track.js";
import useStreams from "hooks/useStreams.js";
import "styles/trainer.css";

const year = new Date().getFullYear();
const EMPTY = { year, number: 1, label: "", startDate: "", endDate: "", deactivationGraceDays: 0, notes: "", isActive: true };

export default function Streams() {
  const { streams, years, reload } = useStreams();
  const [yearFilter, setYearFilter] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setError(""); setFieldErrors({}); };
  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({ year: s.year, number: s.number, label: s.label || "", startDate: s.startDate, endDate: s.endDate,
              deactivationGraceDays: s.deactivationGraceDays, notes: s.notes || "", isActive: s.isActive });
    setError(""); setFieldErrors({});
  };

  async function save(e) {
    e.preventDefault();
    setError(""); setFieldErrors({});
    if (form.endDate < form.startDate) { setFieldErrors({ endDate: "End date must be on or after the start date." }); return; }
    setBusy(true);
    try {
      const body = { ...form, year: Number(form.year), number: Number(form.number), deactivationGraceDays: Number(form.deactivationGraceDays) };
      if (editingId) await api(`/manage/streams/${editingId}/`, { method: "PATCH", body });
      else await api("/manage/streams/", { method: "POST", body });
      setNotice(editingId ? "Stream updated." : "Stream created.");
      setForm(null);
      await reload();
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fields || err.data?.fields || {});
    } finally { setBusy(false); }
  }

  async function toggle(s) {
    try {
      await api(`/manage/streams/${s.id}/`, { method: "PATCH", body: { isActive: !s.isActive } });
      setNotice(`${s.name} ${s.isActive ? "closed" : "re-opened"}.`);
      await reload();
    } catch (err) { setError(err.message); }
  }

  async function remove(s) {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try {
      await api(`/manage/streams/${s.id}/`, { method: "DELETE" });
      setNotice("Stream deleted.");
      await reload();
    } catch (err) { setError(err.message); }
  }

  const rows = (streams || []).filter((s) => !yearFilter || String(s.year) === yearFilter);

  return (
    <section className="panel tr-section">
      <div className="tr-head">
        <div>
          <h2>Streams</h2>
          <p className="form-hint">A year has up to six NYSC streams. In-Camp trainers, corps members and courses live inside a stream; their accounts switch off when the stream ends (plus any grace days).</p>
        </div>
        <button type="button" className="primary-button" onClick={openNew}><Plus size={16} /> New stream</button>
      </div>

      <div className="tr-filters">
        <label>Year
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} aria-label="Filter by year">
            <option value="">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {notice && <p className="inline-message success" role="status">{notice}</p>}
      {error && !form && <p className="inline-message error" role="alert">{error}</p>}

      {streams === null ? <p className="form-hint">Loading…</p> : rows.length === 0 ? (
        <div className="empty-state"><h3>No streams yet</h3><p>Create the first stream, then add its camps and In-Camp trainers.</p></div>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead><tr><th>Stream</th><th>Duration</th><th>Accounts end</th><th>Camps</th><th>Corps members</th><th>Trainers</th><th>Proposals</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{fmtDate(s.startDate)} – {fmtDate(s.endDate)}</td>
                  <td>{fmtDate(s.deactivationDate)}{s.deactivationGraceDays > 0 && <><br /><small className="form-hint">+{s.deactivationGraceDays} d grace</small></>}</td>
                  <td>{s.counts.camps}</td>
                  <td>{s.counts.corpers}</td>
                  <td>{s.counts.trainers}</td>
                  <td>{s.counts.courses}{s.counts.pendingProposals > 0 && <span className="cp-badge cp-badge--warn" style={{ marginLeft: 6 }}>{s.counts.pendingProposals} pending</span>}</td>
                  <td><span className={`cp-badge ${["running", "upcoming"].includes(s.status) ? "cp-badge--ok" : ""}`}>{STREAM_STATUS_LABEL[s.status] || s.status}</span></td>
                  <td>
                    <div className="tr-actions">
                      <button type="button" className="ghost-button small" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}><Pencil size={14} /></button>
                      <button type="button" className="ghost-button small" onClick={() => toggle(s)} aria-label={`${s.isActive ? "Close" : "Re-open"} ${s.name}`} title={s.isActive ? "Close stream" : "Re-open stream"}><Power size={14} /></button>
                      <button type="button" className="danger-button small" onClick={() => remove(s)} aria-label={`Delete ${s.name}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label={editingId ? "Edit stream" : "New stream"} onClick={() => !busy && setForm(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit stream" : "New stream"}</h3>
            <form onSubmit={save} className="tr-form" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <label>Year *
                <input type="number" min="2000" max="2200" value={form.year} onChange={set("year")} required />
                {fieldErrors.year && <span className="field-error">{fieldErrors.year}</span>}
              </label>
              <label>Stream number (1–6) *
                <select value={form.number} onChange={set("number")} required>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Stream {n}</option>)}
                </select>
                {fieldErrors.number && <span className="field-error">{fieldErrors.number}</span>}
              </label>
              <label style={{ gridColumn: "1 / -1" }}>Label (optional)
                <input value={form.label} onChange={set("label")} maxLength={80} placeholder="e.g. October – November" />
              </label>
              <label>Start date *
                <input type="date" value={form.startDate} onChange={set("startDate")} required />
                {fieldErrors.startDate && <span className="field-error">{fieldErrors.startDate}</span>}
              </label>
              <label>End date *
                <input type="date" value={form.endDate} onChange={set("endDate")} required min={form.startDate || undefined} />
                {fieldErrors.endDate && <span className="field-error">{fieldErrors.endDate}</span>}
              </label>
              <label>Grace days after end
                <input type="number" min="0" max="365" value={form.deactivationGraceDays} onChange={set("deactivationGraceDays")} />
                <span className="form-hint">Accounts are deactivated the day after end date + grace days.</span>
                {fieldErrors.deactivationGraceDays && <span className="field-error">{fieldErrors.deactivationGraceDays}</span>}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "end", minHeight: 46 }}>
                <input type="checkbox" checked={form.isActive} onChange={set("isActive")} /> Open (available for sign-up and trainers)
              </label>
              <label style={{ gridColumn: "1 / -1" }}>Notes
                <textarea rows={2} value={form.notes} onChange={set("notes")} maxLength={1000} />
              </label>
              {error && <p className="field-error" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
              <div className="tr-actions" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
                <button type="button" className="ghost-button" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create stream"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
