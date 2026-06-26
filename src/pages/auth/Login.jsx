import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "lib/auth.jsx";
import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import { FormField, SubmitButton } from "components/forms/FormField.jsx";
import AuthError from "components/auth/AuthError.jsx";
import useAuthForm from "hooks/useAuthForm.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

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
    remember: false,
  });

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationErrors = {};

    if (!form.email.trim()) {
      validationErrors.email =
        "Username or email is required.";
    }

    if (!form.password) {
      validationErrors.password =
        "Password is required.";
    }

    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    startSubmit();

    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      });

      if (!user) {
        throw new Error(
          "Authentication failed. No user data was returned."
        );
      }

      if (
        user.role === "trainer" &&
        (!user.isAuthorized || !user.isActive)
      ) {
        navigate("/inactive-account", {
          replace: true,
        });

        return;
      }

      const pendingProgramId =
        location.state?.pendingProgramId;

      if (pendingProgramId) {
        try {
          await api("/applications/create/", {
            method: "POST",
            body: {
              programId: pendingProgramId,
              motivation:
                "I want to gain practical skills through SAED.",
            },
          });
        } catch {
          // ignore — application may already exist
        }
      }

      const destination =
        location.state?.redirectTo ||
        (user.role === "dunis_admin"
          ? "/app/dunis-admin"
          : "/app");

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      setSubmitError(err);
    } finally {
      endSubmit();
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to access your account"
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
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
          <label className="remember-label">
            <span className="checkbox-clickable">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) =>
                  update(
                    "remember",
                    e.target.checked
                  )
                }
              />
              <span className="checkbox-custom"></span>
            </span>
            Remember me
          </label>

          <Link to="/forgot">
            Forgot Password?
          </Link>
        </div>

        <AuthError message={error} />

        <SubmitButton loading={submitting}>
          Login →
        </SubmitButton>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{" "}
        <Link to="/signup">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
