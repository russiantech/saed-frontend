import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import {FormField, SubmitButton} from "components/forms/FormField.jsx";
import AuthError from "components/auth/AuthError.jsx";
import useAuthForm from "hooks/useAuthForm.js";

const STEPS = {
  EMAIL: 1,
  VERIFY: 2,
  RESET: 3,
  SUCCESS: 4,
};

export default function ForgotPassword() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");

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
      clearErrors();
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!code.trim()) {
      setFieldErrors({ code: "Verification code is required." });
      return;
    }

    startSubmit();
    try {
      await api("/auth/verify-reset-code/", {
        method: "POST",
        body: { email: form.email, code, token: resetToken },
      });
      setStep(STEPS.RESET);
      clearErrors();
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
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
          code,
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
      <AuthLayout backLink="/login" title="Password Reset Successful">
        <div className="success-message">
          <p>Your password has been reset successfully.</p>
          <Link to="/login" className="primary-button">Login Now</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      backLink="/login"
      title={step === STEPS.RESET ? "Set New Password" : "Forgot Password?"}
      subtitle={
        step === STEPS.EMAIL
          ? "Enter your email and we'll send you a reset code."
          : step === STEPS.VERIFY
          ? "Enter the verification code sent to your email."
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
        <form className="auth-form" onSubmit={handleVerifyCode}>
          <FormField
            label="Verification Code"
            name="code"
            value={code}
            onChange={(_, val) => setCode(val)}
            error={fields.code}
            placeholder="Enter 6-digit code"
            required
          />
          <AuthError message={error} />
          <SubmitButton loading={submitting}>Verify Code</SubmitButton>
          <button type="button" className="text-button" onClick={() => setStep(STEPS.EMAIL)}>
            ← Back to Email
          </button>
        </form>
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

