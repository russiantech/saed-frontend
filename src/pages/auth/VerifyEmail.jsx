import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  const token = searchParams.get("token");
  const urlEmail = searchParams.get("email");

  useEffect(() => {
    if (urlEmail) setResendEmail(urlEmail);
  }, [urlEmail]);

  useEffect(() => {
    if (!token) {
      if (urlEmail) {
        setStatus("error");
        setMessage("Your email is not verified. Please enter your email below to resend the verification link.");
      } else {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new one.");
      }
      return;
    }

    const controller = new AbortController();
    api("/auth/verify-email/", { method: "POST", body: { token }, signal: controller.signal })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setStatus("error");
          setMessage(err.message || "Verification failed. The link may have expired.");
        }
      });
    return () => controller.abort();
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      await api("/auth/resend-verification/", { method: "POST", body: { email: resendEmail } });
      setMessage("A new verification email has been sent.");
    } catch (err) {
      setMessage(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout  title="Email Verification">
      <div className="verify-status">
        {status === "verifying" && (
          <>
            <div className="spinner" />
            <p>Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <Link to="/login" className="primary-button">OK</Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="error-icon">✕</div>
            <p>{message}</p>
            <form onSubmit={handleResend} style={{ width: "100%" }}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{ width: "100%", marginBottom: 12 }}
              />
              <button type="submit" className="wide-button" disabled={resending || !resendEmail}>
                {resending ? "Sending..." : "Resend Verification Email"}
              </button>
            </form>
            <Link to="/signup">Create a new account</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

