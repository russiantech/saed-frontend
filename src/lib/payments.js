// Shared Paystack checkout helper.
//
// Flow: backend /payments/* "init" endpoint -> { reference, accessCode, publicKey, ... }
//       -> Paystack Inline resumeTransaction(accessCode) (falls back to a redirect)
//       -> ALWAYS confirm with POST /payments/verify/ (server-side verification).
// The browser callback is never trusted: access/activation only ever happens on the server.
import { api } from "./api.js";

const INLINE_SRC = "https://js.paystack.co/v2/inline.js";
let scriptPromise = null;

export function loadPaystack() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = INLINE_SRC;
      el.async = true;
      el.onload = () => resolve(window.PaystackPop);
      el.onerror = () => { scriptPromise = null; reject(new Error("Could not load Paystack. Check your connection.")); };
      document.body.appendChild(el);
    });
  }
  return scriptPromise;
}

/**
 * Open checkout for an init payload. Resolves { status: "success" | "closed", reference }.
 * "success" only means the popup says it finished: callers must still call verifyPayment().
 */
export async function openCheckout(init) {
  if (!init?.accessCode && !init?.authorizationUrl) throw new Error("Payment could not be started.");
  try {
    const Pop = await loadPaystack();
    if (Pop && init.accessCode) {
      return await new Promise((resolve) => {
        const popup = new Pop();
        popup.resumeTransaction(init.accessCode, {
          onSuccess: (tx) => resolve({ status: "success", reference: tx?.reference || init.reference }),
          onCancel: () => resolve({ status: "closed", reference: init.reference }),
          onError: () => resolve({ status: "closed", reference: init.reference }),
        });
      });
    }
  } catch {
    /* fall through to redirect */
  }
  if (init.authorizationUrl) {
    window.location.assign(init.authorizationUrl); // returns via /app/payment/callback?reference=...
    return new Promise(() => {});
  }
  throw new Error("Payment could not be started.");
}

/** Verify on the server. Never throws for "pending"; 409 (amount mismatch) is returned as { status: "mismatch" }. */
export async function verifyPayment(reference) {
  try {
    return await api("/payments/verify/", { method: "POST", body: { reference } });
  } catch (err) {
    if (err.status === 409 && err.data) return { ...err.data, status: err.data.status || "mismatch" };
    throw err;
  }
}

/** Poll verify a few times: the webhook or bank may take a moment. Stops on any final state. */
export async function verifyWithRetry(reference, { tries = 5, delayMs = 2500, onTick } = {}) {
  let last = null;
  for (let i = 0; i < tries; i += 1) {
    last = await verifyPayment(reference);
    onTick?.(last, i);
    if (last.status && last.status !== "pending") return last;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return last;
}

/** init endpoint -> checkout -> verify. Returns the final verify result (or { status: "closed" }). */
export async function payFlow(initPath, body) {
  const init = await api(initPath, { method: "POST", body });
  if (init.alreadyPaid || init.hasAccess) return { status: "success", ...init };
  const checkout = await openCheckout(init);
  if (checkout.status === "closed") {
    // The customer may have paid and closed the popup: verify once before declaring it cancelled.
    const r = await verifyPayment(init.reference).catch(() => null);
    return r && r.status === "success" ? r : { status: "closed", reference: init.reference };
  }
  return verifyWithRetry(init.reference);
}

export const naira = (v) => {
  const n = Number(v || 0);
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
};
