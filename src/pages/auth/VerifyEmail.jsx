import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

import { api } from "lib/api.js";
import { useAuth } from "lib/auth.jsx";
import AuthLayout from "components/auth/AuthLayout.jsx";
import { SubmitButton } from "components/forms/FormField.jsx";

const CODE_LENGTH = 6;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [emailInput, setEmailInput] = useState(searchParams.get("email") || "");
  const email = emailInput;

  const [step, setStep] = useState(searchParams.get("email") ? "code_sent" : "idle");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (email && step === "code_sent") {
      api("/auth/send-code/", { method: "POST", body: { email } })
        .then(() => startCooldown())
        .catch((err) => setError(err.message || "Failed to send code."));
    }
  }, []);

  function handleDigitChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      const fullCode = newDigits.join("");
      handleVerify(fullCode);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newDigits = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => d === "");
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();

    if (newDigits.every((d) => d !== "")) {
      handleVerify(newDigits.join(""));
    }
  }

  async function handleSendCode() {
    if (!emailInput.trim()) {
      setError("Enter your email address.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api("/auth/send-code/", { method: "POST", body: { email: emailInput.trim() } });
      setStep("code_sent");
      startCooldown();
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(codeStr) {
    if (!codeStr || codeStr.length !== CODE_LENGTH) return;
    setVerifying(true);
    setError("");
    try {
      const data = await api("/auth/verify-code/", {
        method: "POST",
        body: { email, code: codeStr },
      });
      if (data.user) {
        setUser(data.user);
        setStep("verified");
        setTimeout(() => navigate("/app/dashboard", { replace: true }), 1500);
      }
    } catch (err) {
      if (err.data?.fields) {
        setError(Object.values(err.data.fields).join(". "));
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setDigits(Array(CODE_LENGTH).fill(""));
    await handleSendCode();
  }

  return (
    <AuthLayout title="Email Verification">
      <div className="verify-status">
        {step === "idle" && (
          <>
            <div className="success-icon">✉</div>
            {email ? (
              <p>Click the button below to receive a verification code at <strong>{email}</strong>.</p>
            ) : (
              <p>Enter your email address to receive a verification code.</p>
            )}
            {!email && (
              <input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid var(--border, #ccc)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  marginBottom: "16px",
                  outline: "none",
                }}
                autoFocus
              />
            )}
            <SubmitButton loading={sending} onClick={handleSendCode} type="button">
              Click to verify your email
            </SubmitButton>
          </>
        )}

        {step === "code_sent" && (
          <>
            <p>A 6-digit code has been sent to <strong>{email}</strong>. Enter it below.</p>

            <div className="code-boxes" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="code-box"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {verifying && <p style={{ marginTop: 12 }}>Verifying...</p>}
            {error && <p style={{ color: "var(--error, #dc3545)", marginTop: 8 }}>{error}</p>}

            <p style={{ marginTop: 20, fontSize: "14px", color: "var(--muted)" }}>
              {resendCooldown > 0 ? (
                <span>Resend code in {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: "none", border: "none", color: "var(--brand, #1a5f2a)", cursor: "pointer", textDecoration: "underline", fontSize: "14px" }}
                >
                  Resend Code
                </button>
              )}
            </p>
          </>
        )}

        {step === "verified" && (
          <>
            <div className="success-icon">✓</div>
            <p>Email verified successfully! Redirecting to dashboard...</p>
          </>
        )}

        {step === "error" && (
          <>
            <div className="error-icon">✕</div>
            <p>{error}</p>
            <Link to="/signup">Create a new account</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
