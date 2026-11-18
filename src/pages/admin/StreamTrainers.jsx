import { useCallback, useEffect, useState } from "react";
import { Mail, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";

import { api } from "lib/api.js";
import { fmtDate, daysLabel } from "lib/track.js";
import { SKILL_AREA_OPTIONS } from "constants/constants.js";
import useStreams from "hooks/useStreams.js";
import "styles/trainer.css";

const EMPTY = { fullName: "", email: "", phone: "", streamId: "", specialization: "", password: "", bio: "" };

export default function StreamTrainers() {
  const { streams } = useStreams();
  const [rows, setRows] = useState(null);
  const [streamId, setStreamId] = useState("");
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);          // create / edit modal
  const [editingId, setEditingId] = useState(null);
  const [reactivate, setReactivate] = useState(null); // { trainer, streamId }
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const openStreams = (streams || []).filter((s) => s.isActive && !["ended"].includes(s.status));

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (streamId) qs.set("streamId", streamId);
    if (state) qs.set("state", state);
    if (q.trim()) qs.set("q", q.trim());
    try {
      const d = await api(`/manage/stream-trainers/${qs.toString() ? `?${qs}` : ""}`);
      setRows(d.trainers || []);
    } catch (e) { setError(e.message); setRows([]); }
  }, [streamId, state, q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setEditingId(null); setForm({ ...EMPTY, streamId: openStreams[0] ? String(openStreams[0].id) : "" }); setError(""); setFieldErrors({}); };
  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({ fullName: t.fullName, email: t.email, phone: t.phone || "", streamId: t.currentStreamId ? String(t.currentStreamId) : "",
              specialization: t.specialization || "", bio: t.bio || "" });
    setError(""); setFieldErrors({});
  };

  async function run(fn, okMessage) {
    setBusy(true); setError(""); setFieldErrors({});
    try { await fn(); if (okMessage) setNotice(okMessage); await load(); return true; }
    catch (err) { setError(err.message); setFieldErrors(err.data?.fields || {}); return false; }
    finally { setBusy(false); }
  }

  async function save(e) {
    e.preventDefault();
    const body = { ...form, streamId: form.streamId ? Number(form.streamId) : undefined };
    if (!body.password) delete body.password;
    const ok = await run(() => editingId
      ? api(`/manage/stream-trainers/${editingId}/`, { method: "PATCH", body })
      : api("/manage/stream-trainers/", { method: "POST", body }),
      editingId ? "Trainer updated." : "Trainer created. An invitation e-mail with a set-password link was sent.");
    if (ok) setForm(null);
  }

  const deactivate = (t) => window.confirm(`Deactivate ${t.fullName}? They will lose In-Camp access until re-activated.`)
    && run(() => api(`/manage/stream-trainers/${t.id}/deactivate/`, { method: "POST", body: {} }), `${t.fullName} deactivated.`);
  const remove = (t) => window.confirm(`Delete ${t.fullName}? This cannot be undone.`)
    && run(() => api(`/manage/stream-trainers/${t.id}/`, { method: "DELETE" }), "Trainer deleted.");
  const invite = (t) => run(() => api(`/manage/stream-trainers/${t.id}/invite/`, { method: "POST", body: {} }), `Invitation sent to ${t.email}.`);
  async function doReactivate(e) {
    e.preventDefault();
    const ok = await run(() => api(`/manage/stream-trainers/${reactivate.trainer.id}/reactivate/`, { method: "POST", body: { streamId: Number(reactivate.streamId) } }),
      `${reactivate.trainer.fullName} re-activated.`);
    if (ok) setReactivate(null);
  }

  const err = (k) => fieldErrors[k] && <span className="field-error">{fieldErrors[k]}</span>;

  return (
    <section className="panel tr-section">
      <div className="tr-head">
        <div>
          <h2>In-Camp trainers</h2>
          <p className="form-hint">Create a trainer for a stream. They get an e-mail to set their password. The account ends with the stream and can be re-activated for a later one.</p>
        </div>
        <button type="button" className="primary-button" onClick={openNew} disabled={openStreams.length === 0} title={openStreams.length === 0 ? "Create a stream first" : undefined}><Plus size={16} /> Add trainer</button>
      </div>

      <div className="tr-filters">
        <label>Stream
          <select value={streamId} onChange={(e) => setStreamId(e.target.value)} aria-label="Filter by stream">
            <option value="">All streams</option>
            {(streams || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>Account
          <select value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by account state">
            <option value="">Any</option><option value="active">Active</option><option value="expired">Expired / deactivated</option>
          </select>
        </label>
        <label>Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or phone" aria-label="Search trainers" />
        </label>
      </div>

      {notice && <p className="inline-message success" role="status">{notice}</p>}
      {error && !form && !reactivate && <p className="inline-message error" role="alert">{error}</p>}

      {rows === null ? <p className="form-hint">Loading…</p> : rows.length === 0 ? (
        <div className="empty-state"><h3>No In-Camp trainers</h3><p>{openStreams.length === 0 ? "Create a stream first, then add trainers to it." : "Add the first trainer for a stream."}</p></div>
      ) : (
        <div className="tr-table-wrap">
          <table className="tr-table">
            <thead><tr><th>Trainer</th><th>Contact</th><th>Skill</th><th>Stream</th><th>Courses</th><th>Account</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {rows.map((t) => {
                const cur = t.memberships.find((m) => m.status === "active") || t.memberships[0];
                return (
                  <tr key={t.id}>
                    <td><strong>{t.fullName}</strong>{!t.hasPassword && <><br /><small className="form-hint">Awaiting password set-up</small></>}</td>
                    <td>{t.email}<br /><small className="form-hint">{t.phone}</small></td>
                    <td>{t.specializationLabel || "—"}</td>
                    <td>{cur ? <>{cur.streamName}<br /><small className="form-hint">{fmtDate(cur.startDate)} – {fmtDate(cur.endDate)}</small></> : "—"}</td>
                    <td>{t.courseCount}</td>
                    <td>
                      <span className={`cp-badge ${t.state === "active" ? "cp-badge--ok" : "cp-badge--warn"}`}>{t.state === "active" ? "Active" : "Expired"}</span>
                      {cur?.daysRemaining != null && <><br /><small className="form-hint">{daysLabel(cur.daysRemaining)}</small></>}
                    </td>
                    <td>
                      <div className="tr-actions">
                        <button type="button" className="ghost-button small" onClick={() => openEdit(t)} aria-label={`Edit ${t.fullName}`} title="Edit"><Pencil size={14} /></button>
                        {t.state === "active" ? (
                          <>
                            <button type="button" className="ghost-button small" onClick={() => invite(t)} aria-label={`Resend invitation to ${t.fullName}`} title="Resend invitation"><Mail size={14} /></button>
                            <button type="button" className="ghost-button small" onClick={() => deactivate(t)} aria-label={`Deactivate ${t.fullName}`} title="Deactivate"><Power size={14} /></button>
                          </>
                        ) : (
                          <button type="button" className="ghost-button small" onClick={() => setReactivate({ trainer: t, streamId: openStreams[0] ? String(openStreams[0].id) : "" })} aria-label={`Re-activate ${t.fullName}`} title="Re-activate for a stream"><RotateCcw size={14} /></button>
                        )}
                        <button type="button" className="danger-button small" onClick={() => remove(t)} aria-label={`Delete ${t.fullName}`} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label={editingId ? "Edit trainer" : "Add trainer"} onClick={() => !busy && setForm(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit In-Camp trainer" : "Add In-Camp trainer"}</h3>
            <form onSubmit={save} className="tr-form" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <label style={{ gridColumn: "1 / -1" }}>Full name *
                <input value={form.fullName} onChange={set("fullName")} required placeholder="First name and last name" />{err("fullName")}
              </label>
              <label>Email *
                <input type="email" value={form.email} onChange={set("email")} required autoComplete="off" />{err("email")}
              </label>
              <label>Phone *
                <input value={form.phone} onChange={set("phone")} required inputMode="tel" />{err("phone")}
              </label>
              <label>Stream *
                <select value={form.streamId} onChange={set("streamId")} required>
                  <option value="">Select stream</option>
                  {(editingId ? streams || [] : openStreams).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>{err("streamId")}
                {editingId && <span className="form-hint">Changing the stream moves the trainer’s current account window.</span>}
              </label>
              <label>Skill area
                <select value={form.specialization} onChange={set("specialization")}>
                  <option value="">Not specified</option>
                  {SKILL_AREA_OPTIONS.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                </select>{err("specialization")}
              </label>
              {!editingId && (
                <label style={{ gridColumn: "1 / -1" }}>Temporary password (optional)
                  <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
                  <span className="form-hint">Leave blank: the trainer sets their own password from the e-mail link. A password is never e-mailed.</span>
                  {err("password")}
                </label>
              )}
              <label style={{ gridColumn: "1 / -1" }}>Bio
                <textarea rows={2} value={form.bio} onChange={set("bio")} maxLength={500} />
              </label>
              {error && <p className="field-error" role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
              <div className="tr-actions" style={{ gridColumn: "1 / -1", justifyContent: "flex-end" }}>
                <button type="button" className="ghost-button" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create & send invitation"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reactivate && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label="Re-activate trainer" onClick={() => !busy && setReactivate(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Re-activate {reactivate.trainer.fullName}</h3>
            <form onSubmit={doReactivate} className="tr-form" style={{ display: "grid", gap: 14 }}>
              <label>Stream *
                <select value={reactivate.streamId} onChange={(e) => setReactivate((r) => ({ ...r, streamId: e.target.value }))} required>
                  <option value="">Select stream</option>
                  {openStreams.map((s) => <option key={s.id} value={s.id}>{s.name} ({fmtDate(s.startDate)} – {fmtDate(s.endDate)})</option>)}
                </select>
              </label>
              {error && <p className="field-error" role="alert">{error}</p>}
              <div className="tr-actions" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="ghost-button" onClick={() => setReactivate(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="primary-button" disabled={busy || !reactivate.streamId}>Re-activate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
