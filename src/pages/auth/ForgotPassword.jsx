import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import {FormField, SubmitButton} from "components/forms/FormField.jsx";
import AuthError from "components/auth/AuthError.jsx";
import useAuthForm from "hooks/useAuthForm.js";

const CODE_LENGTH = 6;
const STEPS = {
  EMAIL: 1,
  VERIFY: 2,
  RESET: 3,
  SUCCESS: 4,
};

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [resetToken, setResetToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  const {
    form,
    fields,
    error,
    submitting,
    update,
    setFieldErrors,
    startSubmit,
    endSubmit,
    setSubmitError,
    clearErrors,
  } = useAuthForm({ email: "" });

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

  async function handleSendCode(e) {
    e.preventDefault();
    if (!form.email.trim()) {
      setFieldErrors({ email: "Email is required." });
      return;
    }

    startSubmit();
    try {
      const res = await api("/auth/forgot-password/", {
        method: "POST",
        body: { email: form.email },
      });
      setResetToken(res.token);
      setStep(STEPS.VERIFY);
      setDigits(Array(CODE_LENGTH).fill(""));
      clearErrors();
      startCooldown();
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  function handleDigitChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      handleVerifyCode(newDigits.join(""));
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
      handleVerifyCode(newDigits.join(""));
    }
  }

  async function handleVerifyCode(codeStr) {
    if (!codeStr || codeStr.length !== CODE_LENGTH) return;
    startSubmit();
    try {
      await api("/auth/verify-reset-code/", {
        method: "POST",
        body: { email: form.email, code: codeStr, token: resetToken },
      });
      setStep(STEPS.RESET);
      clearErrors();
    } catch (err) {
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setDigits(Array(CODE_LENGTH).fill(""));
    try {
      const res = await api("/auth/forgot-password/", {
        method: "POST",
        body: { email: form.email },
      });
      setResetToken(res.token);
      clearErrors();
      startCooldown();
    } catch (err) {
      setSubmitError(err);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const errors = {};
    if (!form.password || form.password.length < 8) errors.password = "Use at least 8 characters.";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    startSubmit();
    try {
      await api("/auth/reset-password/", {
        method: "POST",
        body: {
          email: form.email,
          token: resetToken,
          code: digits.join(""),
          password: form.password,
        },
      });
      setStep(STEPS.SUCCESS);
      clearErrors();
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  if (step === STEPS.SUCCESS) {
    return (
      <AuthLayout title="Password Reset Successful">
        <div className="success-message">
          <p>Your password has been reset successfully.</p>
          <Link to="/login" className="primary-button">Login Now</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        step === STEPS.EMAIL ? "Forgot Password?" :
        step === STEPS.VERIFY ? "Enter Reset Code" :
        "Set New Password"
      }
      subtitle={
        step === STEPS.EMAIL
          ? "Enter your email and we'll send you a reset code."
          : step === STEPS.VERIFY
          ? <>Enter the 6-digit code sent to <strong>{form.email}</strong>.</>
          : "Create a new password for your account."
      }
    >
      {step === STEPS.EMAIL && (
        <form className="auth-form" onSubmit={handleSendCode}>
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            error={fields.email}
            placeholder="you@example.com"
            required
          />
          <AuthError message={error} />
          <SubmitButton loading={submitting}>Send Reset Code</SubmitButton>
        </form>
      )}

      {step === STEPS.VERIFY && (
        <div className="verify-status">
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

          {submitting && <p style={{ marginTop: 12 }}>Verifying...</p>}
          <AuthError message={error} />

          <p style={{ marginTop: 20, fontSize: "14px", color: "var(--muted)" }}>
            {resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-button"
              >
                Resend Code
              </button>
            )}
          </p>
          <button type="button" className="text-button" onClick={() => setStep(STEPS.EMAIL)}>
            ← Back to Email
          </button>
        </div>
      )}

      {step === STEPS.RESET && (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <FormField
            label="New Password"
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            error={fields.password}
            placeholder="Create new password"
            minLength={8}
            required
          />
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={update}
            error={fields.confirmPassword}
            placeholder="Confirm new password"
            required
          />
          <AuthError message={error} />
          <SubmitButton loading={submitting}>Reset Password</SubmitButton>
        </form>
      )}

      <p className="auth-switch">
        Remember your password? <Link to="/login">Login here</Link>
      </p>
    </AuthLayout>
  );
}
