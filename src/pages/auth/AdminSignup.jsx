import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "lib/auth.jsx";
import AuthLayout from "components/auth/AuthLayout.jsx";
import AuthError from "components/auth/AuthError.jsx";
import { FormField, FormRow, SubmitButton } from "components/forms/FormField.jsx";
import useAuthForm from "hooks/useAuthForm.js";
import { validateFullName, validateEmail, validateUsername, validatePassword, validatePhone } from "constants/validators.js";

const INITIAL_FORM = {
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
};

export default function AdminSignup() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const form = useAuthForm(INITIAL_FORM);

    function validate() {
        const errors = {};
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

    async function handleSubmit(event) {
        event.preventDefault();
        const errors = validate();
        form.setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        form.startSubmit();
        try {
            const res = await fetch("/api/auth/admin-signup/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: form.form.fullName,
                    username: form.form.username,
                    email: form.form.email,
                    phone: form.form.phone,
                    password: form.form.password,
                }),
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.fields) {
                    form.setFieldErrors(data.fields);
                }
                throw new Error(data.error || "Signup failed.");
            }

            if (data.user) {
                await login(data.user);
                navigate("/app/dunis-admin");
            }
        } catch (err) {
            form.setSubmitError(err);
        } finally {
            form.endSubmit();
        }
    }

    return (
        <AuthLayout title="Admin Account Setup" subtitle="Create a hidden admin account">
            <form className="auth-form" onSubmit={handleSubmit}>
                <FormField
                    label="Full Name"
                    name="fullName"
                    value={form.form.fullName}
                    onChange={form.update}
                    error={form.fields.fullName}
                    placeholder="Enter first and last name"
                    required
                />
                <FormField
                    label="Username"
                    name="username"
                    value={form.form.username}
                    onChange={form.update}
                    error={form.fields.username}
                    placeholder="Choose a username"
                    required
                />
                <FormRow>
                    <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={form.form.email}
                        onChange={form.update}
                        error={form.fields.email}
                        placeholder="admin@example.com"
                        required
                    />
                    <FormField
                        label="Phone Number"
                        name="phone"
                        type="phone"
                        value={form.form.phone}
                        onChange={form.update}
                        error={form.fields.phone}
                        placeholder="8012345678"
                    />
                </FormRow>
                <FormRow>
                    <FormField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.form.password}
                        onChange={form.update}
                        error={form.fields.password}
                        placeholder="Create a password"
                        minLength={8}
                        required
                    />
                    <FormField
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={form.form.confirmPassword}
                        onChange={form.update}
                        error={form.fields.confirmPassword}
                        placeholder="Confirm password"
                        required
                    />
                </FormRow>
                <p className="password-hint">
                    Password must be at least 8 characters, include uppercase, lowercase, numbers, and symbols
                </p>

                <AuthError message={form.error} />

                <SubmitButton loading={form.submitting}>Create Admin Account</SubmitButton>
            </form>
        </AuthLayout>
    );
}
