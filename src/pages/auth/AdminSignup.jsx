import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldCheck } from "lucide-react";

import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import AuthError from "components/auth/AuthError.jsx";
import { FormField, FormRow, SubmitButton, SuggestPasswordButton } from "components/forms/FormField.jsx";
import useAuthForm from "hooks/useAuthForm.js";
import { validateFullName, validateEmail, validateUsername, validatePassword, validatePhone } from "constants/validators.js";

const INITIAL_FORM = {
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    secret: "",
};

const ADMIN_ROLES = [
    { key: "dunis_admin", label: "Dunis Admin", icon: ShieldCheck, desc: "Platform & payments management" },
    { key: "saed_admin", label: "SAED Admin", icon: Shield, desc: "Program & user moderation" },
];

export default function AdminSignup() {
    const navigate = useNavigate();
    const form = useAuthForm(INITIAL_FORM);

    const [adminRole, setAdminRole] = useState("dunis_admin");
    const isDunis = adminRole === "dunis_admin";

    function validate() {
        const errors = {};
        if (!form.form.secret) errors.secret = "Admin security key is required.";
        const nameErr = validateFullName(form.form.fullName);
        if (nameErr) errors.fullName = nameErr;
        const usernameErr = validateUsername(form.form.username);
        if (usernameErr) errors.username = usernameErr;
        const emailErr = validateEmail(form.form.email);
        if (emailErr) errors.email = emailErr;
        if (form.form.phone) {
            const phoneErr = validatePhone(form.form.phone);
            if (phoneErr) errors.phone = phoneErr;
        }
        const pwErrors = validatePassword(form.form.password, form.form.confirmPassword);
        Object.assign(errors, pwErrors);
        return errors;
    }

    function handleSuggestPassword(pwd) {
        form.update("password", pwd);
        form.update("confirmPassword", pwd);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const errors = validate();
        form.setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        form.startSubmit();
        try {
            const data = await api("/auth/admin-signup/", {
                method: "POST",
                body: {
                    fullName: form.form.fullName,
                    username: form.form.username,
                    email: form.form.email,
                    phone: form.form.phone,
                    password: form.form.password,
                    role: adminRole,
                    secret: form.form.secret,
                },
            });

            navigate(`/verify-email?email=${encodeURIComponent(data.email || form.form.email.trim())}`);
        } catch (err) {
            form.setSubmitError(err);
        } finally {
            form.endSubmit();
        }
    }

    return (
        <AuthLayout
            title={isDunis ? "Dunis Admin Setup" : "SAED Admin Setup"}
            subtitle={isDunis ? "Create an authorized Dunis admin account" : "Create an authorized SAED admin account"}
        >
            <form className="auth-form" onSubmit={handleSubmit} method="POST">
                <div className="role-selector" style={{ marginBottom: "20px" }}>
                    {ADMIN_ROLES.map(({ key, label, icon: Icon, desc }) => (
                        <button
                            key={key}
                            type="button"
                            className={`role-card ${adminRole === key ? "selected" : ""}`}
                            onClick={() => setAdminRole(key)}
                            style={{ padding: "16px 12px", textAlign: "center" }}
                        >
                            <Icon size={24} color={adminRole === key ? "#145f3f" : "var(--muted)"} />
                            <span style={{ fontSize: "14px", fontWeight: "700" }}>{label}</span>
                            <small style={{ fontSize: "11px", color: "var(--muted)", marginTop: "-4px" }}>{desc}</small>
                        </button>
                    ))}
                </div>
                <FormField
                    id="admin-fullname"
                    label="Full Name"
                    name="fullName"
                    autoComplete="name"
                    value={form.form.fullName}
                    onChange={form.update}
                    error={form.fields.fullName}
                    placeholder="e.g. John Doe (first name first)"
                    required
                />
                <FormField
                    id="admin-username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={form.form.username}
                    onChange={form.update}
                    error={form.fields.username}
                    placeholder="Choose a username"
                    required
                />
                <FormRow>
                    <FormField
                        id="admin-email"
                        label="Email Address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.form.email}
                        onChange={form.update}
                        error={form.fields.email}
                        placeholder="admin@example.com"
                        required
                    />
                    <FormField
                        id="admin-phone"
                        label="Phone Number"
                        name="phone"
                        type="phone"
                        autoComplete="tel"
                        value={form.form.phone}
                        onChange={form.update}
                        error={form.fields.phone}
                        placeholder="8012345678"
                    />
                </FormRow>
                <FormRow>
                    <FormField
                        id="admin-password"
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        passwordrules="minlength: 8;"
                        value={form.form.password}
                        onChange={form.update}
                        error={form.fields.password}
                        placeholder="Create a password"
                        minLength={8}
                        required
                        action={<SuggestPasswordButton onGenerate={handleSuggestPassword} />}
                    />
                    <FormField
                        id="admin-confirm-password"
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        passwordrules="minlength: 8;"
                        value={form.form.confirmPassword}
                        onChange={form.update}
                        error={form.fields.confirmPassword}
                        placeholder="Confirm password"
                        required
                    />
                </FormRow>
                <p className="password-hint">
                    Password must be at least 8 characters
                </p>

                <FormField
                    id="admin-security-key"
                    label="Admin Security Key"
                    name="secret"
                    type="security-key"
                    value={form.form.secret}
                    onChange={form.update}
                    error={form.fields.secret}
                    placeholder="Enter system setup security key"
                    required
                />

                <AuthError message={form.error} />

                <SubmitButton loading={form.submitting}>Create Admin Account</SubmitButton>
            </form>
        </AuthLayout>
    );
}
