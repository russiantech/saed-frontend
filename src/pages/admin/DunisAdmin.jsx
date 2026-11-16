import { useCallback, useEffect, useState } from "react";

import { api, qs } from "lib/api.js";
import { naira } from "lib/payments.js";
import Pagination from "components/ui/Pagination.jsx";
import "styles/admin.css";

const badge = (s) => (s === "success" || s === "active" ? "ad-badge--ok" : s === "mismatch" || s === "pending" || s === "requested" ? "ad-badge--warn" : s === "failed" || s === "refunded" || s === "revoked" ? "ad-badge--bad" : "");

function Msg({ m }) { return m ? <div className={`inline-message inline-message--${m.type}`} role="status">{m.text}</div> : null; }

function Settings() {
  const [s, setS] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/admin/platform-settings/").then((d) => {
      setS(d);
      setForm({ feeAmount: d.videoUploadFee.amount, feeEnabled: d.videoUploadFee.enabled, pct: d.lessonPlatformFeePercent,
        activation: d.trainerActivationFee.amount, grace: d.defaultDeactivationGraceDays });
    }).catch((e) => setMsg({ type: "error", text: e.message }));
  }, []);
  if (!form) return <Msg m={msg} />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const d = await api("/admin/platform-settings/", { method: "PATCH", body: {
        videoUploadFee: { amount: form.feeAmount, enabled: form.feeEnabled },
        lessonPlatformFeePercent: form.pct, trainerActivationFee: { amount: form.activation }, defaultDeactivationGraceDays: form.grace } });
      setS(d); setMsg({ type: "success", text: "Settings saved." });
    } catch (er) { setMsg({ type: "error", text: er.message }); } finally { setBusy(false); }
  }

  return (
    <form className="panel ad-page" style={{ padding: 16 }} onSubmit={save}>
      <Msg m={msg} />
      <h3 style={{ margin: 0 }}>Video upload fee</h3>
      <p className="ad-note">Charged to trainers once per lesson that gets a video. Documents and text are always free. This is separate from what corps members pay for premium lessons.</p>
      <div className="ad-form">
        <label>Amount (₦)<input type="number" min="0" step="1" value={form.feeAmount} onChange={set("feeAmount")} /></label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={form.feeEnabled} onChange={set("feeEnabled")} style={{ width: "auto" }} /> Fee enabled</label>
        <span className="ad-note">{s.videoUploadFee.applies ? `Currently charging ${naira(s.videoUploadFee.amount)} per video lesson.` : "Currently off: trainers upload videos free."}</span>
      </div>
      <h3 style={{ margin: "8px 0 0" }}>Other settings</h3>
      <div className="ad-form">
        <label>Platform share of premium lessons (%)<input type="number" min="0" max="100" step="0.5" value={form.pct} onChange={set("pct")} /></label>
        <label>Trainer activation fee (₦)<input type="number" min="1" value={form.activation} onChange={set("activation")} /></label>
        <label>In-Camp deactivation grace (days)<input type="number" min="0" max="365" value={form.grace} onChange={set("grace")} /></label>
      </div>
      <div><button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button></div>
    </form>
  );
}

function Payments() {
  const [f, setF] = useState({ type: "", status: "", q: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [review, setReview] = useState(null);
  const [note, setNote] = useState("");
  const load = useCallback(() => api(`/dunis/payments/${qs({ ...f, page })}`).then(setData).catch((e) => setMsg({ type: "error", text: e.message })), [f, page]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setPage(1); };

  async function resolve(action) {
    try { await api(`/dunis/payments/${review.reference}/resolve/`, { method: "POST", body: { action, note } }); setReview(null); setNote(""); setMsg({ type: "success", text: action === "approve" ? "Payment approved and applied." : "Payment rejected." }); load(); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  }
  const sm = data?.summary;
  return (
    <div className="ad-page">
      <Msg m={msg} />
      {sm && <div className="ad-stats">
        <div className="ad-stat"><strong>{naira(sm.videoUploads.total)}</strong><span>Video upload fees ({sm.videoUploads.count})</span></div>
        <div className="ad-stat"><strong>{naira(sm.lessonAccess.total)}</strong><span>Premium lesson sales ({sm.lessonAccess.count})</span></div>
        <div className="ad-stat"><strong>{naira(sm.lessonAccess.platformShare)}</strong><span>Platform share of lessons</span></div>
        <div className="ad-stat"><strong>{naira(sm.trainerActivation.total)}</strong><span>Trainer activations ({sm.trainerActivation.count})</span></div>
        <div className="ad-stat"><strong>{sm.statusCounts.mismatch}</strong><span>Awaiting review</span></div>
      </div>}
      <div className="ad-form">
        <label>Type<select value={f.type} onChange={set("type")}><option value="">All</option><option value="video_upload">Video upload</option><option value="lesson_access">Lesson access</option><option value="trainer_activation">Trainer activation</option></select></label>
        <label>Status<select value={f.status} onChange={set("status")}><option value="">All</option>{["pending", "success", "failed", "abandoned", "mismatch", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label>Search<input value={f.q} onChange={set("q")} placeholder="Reference, email, lesson" /></label>
        <label>From<input type="date" value={f.from} onChange={set("from")} /></label>
        <label>To<input type="date" value={f.to} onChange={set("to")} /></label>
      </div>
      {!data ? "Loading…" : (
        <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Payer</th><th>Amount</th><th>Status</th><th /></tr></thead>
          <tbody>{data.payments.map((p) => (
            <tr key={p.reference}><td>{new Date(p.createdAt).toLocaleString()}</td><td><code>{p.reference}</code></td><td>{p.type.replace("_", " ")}</td>
              <td>{p.payerName}<br /><small>{p.payerEmail}</small></td><td>{naira(p.amount)}</td>
              <td><span className={`ad-badge ${badge(p.status)}`}>{p.status === "mismatch" ? "needs review" : p.status}</span></td>
              <td>{p.status === "mismatch" && <button className="ghost-button" onClick={() => setReview(p)}>Review</button>}</td></tr>))}
            {data.payments.length === 0 && <tr><td colSpan={7}>No payments match.</td></tr>}</tbody></table></div>
      )}
      {data && <Pagination pagination={data.pagination} onPage={setPage} />}

      {review && (
        <div className="tr-modal" role="dialog" aria-modal="true" aria-label="Review payment" onClick={() => setReview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 1000, padding: 16 }}>
          <div className="panel" style={{ padding: 20, maxWidth: 560, width: "100%", background: "var(--surface,#fff)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Review payment</h3>
            <p className="ad-note">Reference <code>{review.reference}</code> · {review.payerEmail}</p>
            <table className="ad-table"><tbody>
              <tr><th>Requested (what we asked Paystack to charge)</th><td>{naira((review.requestedAmountKobo || 0) / 100)}</td></tr>
              <tr><th>Paystack reported total</th><td>{naira((review.paidAmountKobo || 0) / 100)}</td></tr>
              <tr><th>Gateway fees recorded</th><td>{naira((review.gatewayFeesKobo || 0) / 100)}</td></tr>
              <tr><th>Gateway status</th><td>{review.gatewayStatus}</td></tr></tbody></table>
            <p className="ad-note">Paystack’s total can exceed the requested amount when the customer pays the processing fee. If the difference equals the fee, the payment is normally matched automatically. Approve only if you have confirmed the money was received for this purchase.</p>
            <label style={{ display: "grid", gap: 4 }}>Note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / evidence" /></label>
            <div className="tr-actions" style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button className="primary-button" onClick={() => resolve("approve")}>Approve &amp; apply</button>
              <button className="ghost-button" onClick={() => resolve("reject")}>Reject</button>
              <button className="ghost-button" onClick={() => setReview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Trainers() {
  const [pending, setPending] = useState(null);
  const [all, setAll] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => {
    api("/dunis/pending-payments/").then((d) => setPending(d.trainers)).catch((e) => setMsg({ type: "error", text: e.message }));
    api("/dunis/trainers/").then((d) => setAll(d.trainers)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  async function confirm(t) {
    try { await api("/dunis/confirm-payment/", { method: "POST", body: { userId: t.id, reference: t.paymentReference } }); setMsg({ type: "success", text: `${t.fullName} activated.` }); load(); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  }
  return (
    <div className="ad-page">
      <Msg m={msg} />
      <h3 style={{ margin: 0 }}>Trainers awaiting activation payment</h3>
      {!pending ? "Loading…" : pending.length === 0 ? <p className="ad-note">None. Payments are verified automatically; use this only when a payment reference exists but activation did not complete.</p> : (
        <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Trainer</th><th>Reference</th><th /></tr></thead><tbody>
          {pending.map((t) => (<tr key={t.id}><td>{t.fullName}<br /><small>{t.email}</small></td><td>{t.paymentReference ? <code>{t.paymentReference}</code> : "—"}</td>
            <td>{t.paymentReference && <button className="primary-button" onClick={() => confirm(t)}>Re-verify with Paystack</button>}</td></tr>))}</tbody></table></div>)}
      <h3 style={{ margin: 0 }}>All trainers</h3>
      {all && <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Trainer</th><th>Authorised</th><th>Activated</th><th>Payout account</th></tr></thead><tbody>
        {all.map((t) => (<tr key={t.id}><td>{t.fullName}<br /><small>{t.email}</small></td><td>{t.isAuthorized ? "Yes" : "No"}</td><td>{t.hasPaid ? "Yes" : "No"}</td>
          <td><span className={`ad-badge ${t.bankVerified ? "ad-badge--ok" : "ad-badge--warn"}`}>{t.bankVerified ? "Verified" : t.hasPayoutAccount ? "Unverified" : "Not set"}</span></td></tr>))}</tbody></table></div>}
    </div>
  );
}

function Access() {
  const [f, setF] = useState({ status: "", source: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  useEffect(() => { api(`/dunis/access-activity/${qs({ ...f, page })}`).then(setData).catch(() => setData({ activity: [], pagination: null })); }, [f, page]);
  return (
    <div className="ad-page">
      <div className="ad-form">
        <label>Status<select value={f.status} onChange={(e) => { setF({ ...f, status: e.target.value }); setPage(1); }}><option value="">All</option><option value="active">Active</option><option value="requested">Requested</option><option value="revoked">Revoked</option></select></label>
        <label>Source<select value={f.source} onChange={(e) => { setF({ ...f, source: e.target.value }); setPage(1); }}><option value="">All</option><option value="paystack">Paystack</option><option value="bank_transfer">Bank transfer</option><option value="trainer_grant">Trainer grant</option></select></label>
      </div>
      {!data ? "Loading…" : (<div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Student</th><th>Lesson</th><th>Trainer</th><th>Source</th><th>Paid</th><th>Status</th><th>Updated</th></tr></thead><tbody>
        {data.activity.map((a) => (<tr key={a.id}><td>{a.student}</td><td>{a.lesson}<br /><small>{a.course}</small></td><td>{a.trainer}</td><td>{a.source.replace("_", " ")}</td><td>{naira(a.amountPaid)}</td>
          <td><span className={`ad-badge ${badge(a.status)}`}>{a.status}</span></td><td>{new Date(a.updatedAt).toLocaleDateString()}</td></tr>))}
        {data.activity.length === 0 && <tr><td colSpan={7}>No activity.</td></tr>}</tbody></table></div>)}
      {data?.pagination && <Pagination pagination={data.pagination} onPage={setPage} />}
    </div>
  );
}

const TABS = [["settings", "Fees & settings", Settings], ["payments", "Payments", Payments], ["trainers", "Trainer activation", Trainers], ["access", "Lesson access", Access]];

export default function DunisAdmin() {
  const [tab, setTab] = useState("settings");
  const Active = TABS.find((t) => t[0] === tab)[2];
  return (
    <div className="ad-page">
      <h2 style={{ margin: 0 }}>Payments &amp; Fees</h2>
      <div className="ad-tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className="ad-tab" onClick={() => setTab(k)}>{l}</button>)}</div>
      <Active />
    </div>
  );
}
