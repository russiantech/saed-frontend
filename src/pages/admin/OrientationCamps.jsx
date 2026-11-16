import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";

import { api } from "lib/api.js";
import { STATES } from "data/nigerianStates.js";
import "styles/trainer.css";

const EMPTY = { name: "", state: "", location: "", startDate: "", endDate: "", deactivationGraceDays: 7, isActive: true };

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function OrientationCamps() {
  const [camps, setCamps] = useState(null);
  const [form, setForm] = useState(null);     // null = closed
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api("/manage/orientation-camps/");
      setCamps(d.camps || []);
    } catch (e) {
      setError(e.message);
      setCamps([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function openNew() { setEditingId(null); setForm({ ...EMPTY }); setError(""); }
  function openEdit(c) {
    setEditingId(c.id);
    setForm({ name: c.name, state: c.state, location: c.location || "", startDate: c.startDate || "", endDate: c.endDate || "",
              deactivationGraceDays: c.deactivationGraceDays ?? 7, isActive: c.isActive });
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    if (form.endDate && form.startDate && form.endDate < form.startDate) { setError("The end date must be on or after the start date."); return; }
    setBusy(true);
    try {
      const body = { ...form, deactivationGraceDays: Number(form.deactivationGraceDays) };
      if (editingId) await api(`/manage/orientation-camps/${editingId}/`, { method: "PATCH", body });
      else await api("/manage/orientation-camps/", { method: "POST", body });
      setNotice(editingId ? "Camp updated." : "Camp added.");
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c) {
    try {
      await api(`/manage/orientation-camps/${c.id}/`, { method: "PATCH", body: { isActive: !c.isActive } });
      setNotice(`${c.name} ${c.isActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function remove(c) {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await api(`/manage/orientation-camps/${c.id}/`, { method: "DELETE" });
      setNotice("Camp deleted.");
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <section className="panel tr-section">
      <div className="tr-head">
        <div>
          <h2>SAED Camps</h2>
          <p className="form-hint">Orientation camps used for In-Camp SAED courses and corps-member sign-up. Deactivate a camp to hide it from new sign-ups and course creation.</p>
        </div>
        <button type="button" className="primary-button" onClick={openNew}><Plus size={16} /> Add camp</button>
      </div>

      {notice && <p className="inline-message success" role="status">{notice}</p>}
      {error && !form && <p className="inline-message error" role="alert">{error}</p>}

      {camps === null ? <p className="form-hint">Loading…</p> : camps.length === 0 ? (
        <div className="empty-state"><h3>No camps yet</h3><p>Add the first SAED camp so trainers can attach In-Camp courses to it.</p></div>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead><tr><th>Camp</th><th>State</th><th>Dates</th><th>Grace</th><th>Courses</th><th>Corps members</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {camps.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong>{c.location && <><br /><small className="form-hint">{c.location}</small></>}</td>
                  <td>{c.state}</td>
                  <td>{fmt(c.startDate)} – {fmt(c.endDate)}</td>
                  <td>{c.deactivationGraceDays} d</td>
                  <td>{c.courseCount ?? 0}</td>
                  <td>{c.corperCount ?? 0}</td>
                  <td><span className={`cp-badge ${c.isActive ? "cp-badge--ok" : ""}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div className="tr-actions">
                      <button type="button" className="ghost-button small" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}><Pencil size={14} /></button>
                      <button type="button" className="ghost-button small" onClick={() => toggle(c)} aria-label={`${c.isActive ? "Deactivate" : "Activate"} ${c.name}`} title={c.isActive ? "Deactivate" : "Activate"}><Power size={14} /></button>
                      <button type="button" className="danger-button small" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label={editingId ? "Edit camp" : "Add camp"} onClick={() => !busy && setForm(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit camp" : "Add SAED camp"}</h3>
            <form onSubmit={save} className="tr-form" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <label style={{ gridColumn: "1 / -1" }}>Camp name *
                <input value={form.name} onChange={set("name")} required maxLength={200} placeholder="e.g. Lagos Orientation Camp — Batch C 2026" />
              </label>
              <label>State *
                <select value={form.state} onChange={set("state")} required>
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>Location / address
                <input value={form.location} onChange={set("location")} maxLength={200} placeholder="e.g. Iyana-Ipaja" />
              </label>
              <label>Start date *
                <input type="date" value={form.startDate} onChange={set("startDate")} required />
              </label>
              <label>End date *
                <input type="date" value={form.endDate} onChange={set("endDate")} required min={form.startDate || undefined} />
              </label>
              <label>Access grace period (days)
                <input type="number" min="0" max="365" value={form.deactivationGraceDays} onChange={set("deactivationGraceDays")} />
                <span className="form-hint">In-Camp access ends this many days after the camp ends.</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, alignSelf: "end", minHeight: 46 }}>
                <input type="checkbox" checked={form.isActive} onChange={set("isActive")} /> Active (available for sign-up and new courses)
              </label>
              {error && <p className="field-error" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
              <div className="tr-actions" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
                <button type="button" className="ghost-button" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Add camp"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
