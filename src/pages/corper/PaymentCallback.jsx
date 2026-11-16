// Landing page after Paystack (redirect fallback / bank 3-D Secure). Always verifies on the server.
import { CheckCircle2, Clock3, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { verifyWithRetry } from "lib/payments.js";
import { useAuth } from "lib/auth.jsx";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const { refreshUser } = useAuth();
  const [state, setState] = useState({ phase: "checking" });

  useEffect(() => {
    if (!reference) { setState({ phase: "error", message: "No payment reference found." }); return undefined; }
    let cancelled = false;
    verifyWithRetry(reference, { tries: 6, delayMs: 2500 })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === "success") await refreshUser();
        setState({ phase: res.status || "error", res });
      })
      .catch((err) => !cancelled && setState({ phase: "error", message: err.message }));
    return () => { cancelled = true; };
  }, [reference, refreshUser]);

  const res = state.res || {};
  const target =
    res.paymentType === "trainer_activation" ? "/app/dashboard"
    : res.paymentType === "video_upload" && res.courseId ? `/app/my-courses/${res.courseId}`
    : res.courseId ? `/app/courses/${res.courseId}${res.lessonId ? `?lesson=${res.lessonId}` : ""}` : "/app/dashboard";

  return (
    <div className="empty-state" style={{ maxWidth: 520, margin: "10vh auto", textAlign: "center" }}>
      {state.phase === "checking" && (<><Clock3 size={40} /><h2>Confirming your payment…</h2><p>Please don’t close this page.</p></>)}
      {state.phase === "success" && (<><CheckCircle2 size={40} color="var(--success, #0b6b3a)" /><h2>Payment successful</h2><p>{res.message || "Your payment has been confirmed."}</p><Link className="primary-button" to={target}>Continue</Link></>)}
      {state.phase === "pending" && (<><Clock3 size={40} /><h2>Still processing</h2><p>Your bank hasn’t confirmed yet. If you were charged, access is added automatically as soon as it clears. Reference: <code>{reference}</code></p><Link className="ghost-button" to={target}>Back</Link></>)}
      {state.phase === "mismatch" && (<><AlertTriangle size={40} color="#b7791f" /><h2>Payment under review</h2><p>{res.error || "We received your payment but need to review it."} You have not lost your money. Reference: <code>{reference}</code></p><Link className="ghost-button" to={target}>Back</Link></>)}
      {["failed", "abandoned", "error"].includes(state.phase) && (<><XCircle size={40} color="#c53030" /><h2>{state.phase === "abandoned" ? "Payment cancelled" : "Payment not completed"}</h2><p>{res.message || state.message || "No money was taken. You can try again."}</p><Link className="ghost-button" to={target}>Back</Link></>)}
    </div>
  );
}
