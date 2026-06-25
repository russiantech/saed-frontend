import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import {SubmitButton} from "components/forms/FormField.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }

    api("/auth/verify-email/", { method: "POST", body: { token } })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await api("/auth/resend-verification/", { method: "POST", body: { email } });
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
            <Link to="/login" className="primary-button">Login Now</Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="error-icon">✕</div>
            <p>{message}</p>
            {email && (
              <SubmitButton loading={resending} onClick={handleResend}>
                Resend Verification Email
              </SubmitButton>
            )}
            <Link to="/signup">Create a new account</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

