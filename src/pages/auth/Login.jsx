import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "lib/auth.jsx";
import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import {RoleSelector, FormField, SubmitButton} from "components/forms/FormField.jsx";
// import SubmitButton from "components/SubmitButton.jsx";
import AuthError from "components/auth/AuthError.jsx";
import useAuthForm from "hooks/useAuthForm.js";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

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
  } = useAuthForm({
    email: "",
    password: "",
    role: "corps_member",
    remember: false,
  });

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = {};
    if (!form.email.trim()) errors.email = "Username or email is required.";
    if (!form.password) errors.password = "Password is required.";

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    startSubmit();
    try {
      const loggedUser = await login(form);

      if (loggedUser?.role === "trainer" && (!loggedUser.isAuthorized || !loggedUser.isActive)) {
        navigate("/inactive-account", { replace: true });
        return;
      }

      if (location.state?.pendingProgramId) {
        try {
          await api("/applications/create/", {
            method: "POST",
            body: {
              programId: location.state.pendingProgramId,
              motivation: "I want to gain practical skills through SAED.",
            },
          });
        } catch (err) {
          if (!err.message?.includes("already applied")) throw err;
        }
      }

      const dest = location.state?.redirectTo
        || (loggedUser?.role === "dunis_admin" ? "/app/dunis-admin" : "/app");
      navigate(dest, { replace: true });
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  return (
    <AuthLayout
      backLink="/"
      title="Welcome Back"
      subtitle="Login to access your account"
    >
      <RoleSelector value={form.role} onChange={(role) => update("role", role)} />

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          label="Username or Email"
          name="email"
          value={form.email}
          onChange={update}
          error={fields.email}
          placeholder="Enter your username or email"
          required
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={update}
          error={fields.password}
          placeholder="Enter your password"
          required
        />

        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => update("remember", e.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot">Forgot Password?</Link>
        </div>

        <AuthError message={error} />
        <SubmitButton loading={submitting}>Login →</SubmitButton>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </AuthLayout>
  );
}

