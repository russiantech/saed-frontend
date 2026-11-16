import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { api, qs } from "lib/api.js";
import { naira } from "lib/payments.js";
import Pagination from "components/ui/Pagination.jsx";
import "styles/trainer.css";

function BankForm({ onSaved }) {
  const [banks, setBanks] = useState([]);
  const [acct, setAcct] = useState(null);
  const [bankCode, setBankCode] = useState("");
  const [number, setNumber] = useState("");
  const [resolved, setResolved] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/banks/").then((d) => setBanks(d.banks || [])).catch(() => setMsg({ type: "error", text: "Could not load banks." }));
    api("/trainer/bank-account/").then((a) => { setAcct(a); setBankCode(a.bankCode || ""); setNumber(a.accountNumber || ""); if (a.verified) setResolved(a.accountName); }).catch(() => {});
  }, []);

  const valid = /^\d{10}$/.test(number) && bankCode;
  const bankName = banks.find((b) => b.code === bankCode)?.name || acct?.bankName || "";

  async function verify() {
    setBusy(true); setMsg(null); setResolved("");
    try { const r = await api("/banks/resolve/", { method: "POST", body: { accountNumber: number, bankCode } }); setResolved(r.accountName); }
    catch (e) { setMsg({ type: "error", text: e.message }); } finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setMsg(null);
    try {
      const r = await api("/trainer/bank-account/", { method: "PUT", body: { accountNumber: number, bankCode, bankName } });
      setAcct(r); setMsg({ type: "success", text: "Payout account verified and saved." }); onSaved?.();
    } catch (e) { setMsg({ type: "error", text: e.message }); } finally { setBusy(false); }
  }

  return (
    <section className="panel" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Payout bank account</h3>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
        Paid lessons are split automatically by Paystack: you receive your share in this account, and {acct?.platformFeePercent ?? 10}% goes to the platform. The account name is confirmed with your bank through Paystack.
      </p>
      {acct?.verified && <span className="tr-badge tr-badge--ok" style={{ justifySelf: "start" }}><CheckCircle2 size={12} /> Verified · {acct.bankName} · {acct.accountName}</span>}
      {msg && <div className={`inline-message inline-message--${msg.type}`} role="status">{msg.text}</div>}
      <div className="tr-form">
        <label>Bank<select value={bankCode} onChange={(e) => { setBankCode(e.target.value); setResolved(""); }}><option value="">Select bank…</option>{banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></label>
        <label>Account number<input inputMode="numeric" maxLength={10} value={number} onChange={(e) => { setNumber(e.target.value.replace(/\D/g, "")); setResolved(""); }} /></label>
        <div className="wide tr-actions" style={{ alignItems: "center" }}>
          <button className="ghost-button" disabled={!valid || busy} onClick={verify}>Verify account</button>
          {resolved && <strong>{resolved}</strong>}
          <button className="primary-button" disabled={!valid || !resolved || busy} onClick={save}>Save payout account</button>
        </div>
      </div>
    </section>
  );
}

export default function Earnings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const load = useCallback(() => api(`/trainer/earnings/${qs({ page, status })}`).then(setData).catch((e) => setError(e.message)), [page, status]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary;
  const cards = s ? [
    ["Your net earnings", naira(s.net)], ["Paid out to bank", naira(s.settledToBank)], ["Pending payout", naira(s.pendingSettlement)],
    ["Gross sales", naira(s.gross)], [`Platform fee (${s.lessonPlatformFeePercent}%)`, naira(s.platformFees)], ["Sales", s.salesCount],
    ["Direct-transfer unlocks", s.directTransferUnlocks], ["Video upload fees paid", naira(s.videoFeesPaid)],
  ] : [];

  return (
    <div className="tr-page">
      <h2 style={{ margin: 0 }}>Earnings</h2>
      {error && <div className="inline-message inline-message--error">{error}</div>}
      {data && !data.payout.verified && <div className="inline-message inline-message--warning">Add and verify a payout bank account below so paid lessons can be settled to you.</div>}
      {s && <div className="tr-stats">{cards.map(([k, v]) => <div key={k} className="tr-stat"><strong>{v}</strong><span>{k}</span></div>)}</div>}
      <BankForm onSaved={load} />
      <section className="panel" style={{ padding: 16 }}>
        <div className="tr-head"><h3 style={{ margin: 0 }}>Lesson payments</h3>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
            <option value="">All</option><option value="success">Successful</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="mismatch">Under review</option></select></div>
        {!data ? "Loading…" : data.payments.length === 0 ? <p style={{ color: "var(--muted)" }}>No payments yet.</p> : (
          <div className="tr-table-wrap"><table className="tr-table"><thead><tr><th>Date</th><th>Student</th><th>Lesson</th><th>Amount</th><th>Your share</th><th>Status</th></tr></thead>
            <tbody>{data.payments.map((p) => (
              <tr key={p.reference}><td>{new Date(p.createdAt).toLocaleDateString()}</td><td>{p.studentName}</td><td>{p.lessonTitle}</td><td>{naira(p.amount)}</td><td>{naira(p.yourShare)}</td>
                <td>{p.status === "mismatch" ? "under review" : p.status}</td></tr>))}</tbody></table></div>
        )}
        {data && <Pagination pagination={data.pagination} onPage={setPage} />}
      </section>
    </div>
  );
}
