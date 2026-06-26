import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "lib/auth.jsx";
import AuthLayout from "components/auth/AuthLayout.jsx";
import AuthError from "components/auth/AuthError.jsx";
import { FormField, FormRow, SubmitButton, StepIndicator, TermsCheckbox } from "components/forms/FormField.jsx";
import useAuthForm from "hooks/useAuthForm.js";
import { validateFullName, validateEmail, validatePhone, validateUsername, validatePassword, validateNyscCode, validateRequired } from "constants/validators.js";
import { MESSAGES, SKILL_AREAS } from "constants/constants.js";
import { LAGOS_LGAS } from "data/nigerianStates.js";

const INITIAL_FORM = {
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    nyscStateCode: "",
    lgaOfDeployment: "",
    skillInterest: "",
    skillInterests: [],
    specialization: "",
    partnerLgas: [],
    yearsExperience: "",
    bio: "",
    companyName: "",
    numberTrained: "",
    partnershipLetter: null,
};

export default function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [step, setStep] = useState(1);
    const [agree, setAgree] = useState(false);

    const form = useAuthForm(INITIAL_FORM);

    function validateStep1() {
        const errors = {};
        const err = validateFullName(form.form.fullName);
        if (err) errors.fullName = err;
        
        const usernameErr = validateUsername(form.form.username);
        if (usernameErr) errors.username = usernameErr;
        
        const emailErr = validateEmail(form.form.email);
        if (emailErr) errors.email = emailErr;
        
        const phoneErr = validatePhone(form.form.phone);
        if (phoneErr) errors.phone = phoneErr;
        
        const pwErrors = validatePassword(form.form.password, form.form.confirmPassword);
        Object.assign(errors, pwErrors);
        return errors;
    }

    function validateStep2Corps() {
        const errors = {};
        const codeErr = validateNyscCode(form.form.nyscStateCode);
        if (codeErr) errors.nyscStateCode = codeErr;
        
        const lgaErr = validateRequired(form.form.lgaOfDeployment, MESSAGES.LGA_REQUIRED);
        if (lgaErr) errors.lgaOfDeployment = MESSAGES.LGA_REQUIRED;
        
        if (!form.form.skillInterests || form.form.skillInterests.length === 0) {
            errors.skillInterest = MESSAGES.SKILL_REQUIRED;
        }
        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (step === 1) {
            const errors = validateStep1();
            form.setFieldErrors(errors);
            if (Object.keys(errors).length > 0) return;

            form.startSubmit();
            try {
                const res = await fetch("/api/auth/validate-signup/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fullName: form.form.fullName,
                        username: form.form.username,
                        email: form.form.email,
                        phone: form.form.phone,
                    }),
                });

                if (!res.ok) {
                    let serverFields = {};
                    try {
                        const errData = await res.json();
                        serverFields = errData.fields || {};
                    } catch {}
                    if (Object.keys(serverFields).length > 0) {
                        form.setFieldErrors(serverFields);
                        const fieldMessages = Object.values(serverFields).join(". ");
                        form.setSubmitError(new Error(fieldMessages));
                    }
                    return;
                }

                setStep(2);
            } catch (err) {
                form.setSubmitError(err);
            } finally {
                form.endSubmit();
            }
            return;
        }

        const errors = validateStep2Corps();
        form.setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        form.startSubmit();

        try {
            await signup({ 
                ...form.form, 
                role: "corps_member", 
                stateOfDeployment: "Lagos",
                skillInterests: form.form.skillInterests || [],
            });
            navigate("/app");
        } catch (err) {
            form.setSubmitError(err);
        } finally {
            form.endSubmit();
        }
    }

    const subtitle = step === 1
        ? "Enter your personal details"
        : "Select your skills and deployment info";

    return (
        <AuthLayout title="Create Your Account" subtitle={subtitle}>
            <StepIndicator current={step} total={2} />

            <form className="auth-form" onSubmit={handleSubmit}>
                {step === 1 ? (
                    <PersonalInfo form={form} />
                ) : (
                    <CorpsStep2 form={form} />
                )}

                <AuthError message={form.error} />

                {step === 2 && (
                    <TermsCheckbox checked={agree} onChange={setAgree} />
                )}

                <SubmitButton 
                    loading={form.submitting} 
                    disabled={step === 2 && !agree}
                >
                    {step === 1 ? "Continue to Next Step →" : "Create Account →"}
                </SubmitButton>

                {step === 2 && (
                    <button 
                        type="button" 
                        className="outline-button" 
                        onClick={() => setStep(1)}
                    >
                        ← Back
                    </button>
                )}
            </form>

            <p className="auth-switch">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </AuthLayout>
    );
}

function PersonalInfo({ form }) {
    return (
        <>
            <div className="form-section-title">PERSONAL INFORMATION</div>

            <FormField
                label="Full Name"
                name="fullName"
                value={form.form.fullName}
                onChange={form.update}
                error={form.fields.fullName}
                placeholder="Enter your full name"
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
                    placeholder="you@example.com"
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
                    required
                />
            </FormRow>

            <div className="form-section-title">SECURITY</div>
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
        </>
    );
}

function CorpsStep2({ form }) {
    function toggleSkill(skill) {
        const current = form.form.skillInterests || [];
        const next = current.includes(skill)
            ? current.filter((s) => s !== skill)
            : [...current, skill];
        form.update("skillInterests", next);
        if (next.length > 0) {
            form.update("skillInterest", next[0]);
        } else {
            form.update("skillInterest", "");
        }
    }

    return (
        <>
            <div className="form-section-title">DEPLOYMENT & SKILLS</div>

            <FormField
                label="State Code"
                name="nyscStateCode"
                type="nysc-code"
                value={form.form.nyscStateCode}
                onChange={form.update}
                error={form.fields.nyscStateCode}
                placeholder="LA/26B/0123"
                required
            />

            <FormField
                label="LGA"
                name="lgaOfDeployment"
                type="select"
                value={form.form.lgaOfDeployment}
                onChange={form.update}
                error={form.fields.lgaOfDeployment}
                placeholder="Select your LGA"
                options={LAGOS_LGAS}
                required
            />

            <div className="form-section-title">SELECT YOUR SKILL INTEREST</div>
            <p className="section-hint">Choose one or more skill areas (required)</p>
            <div className="skill-grid">
                {SKILL_AREAS.map((skill) => (
                    <button
                        key={skill}
                        type="button"
                        className={`skill-card ${(form.form.skillInterests || []).includes(skill) ? "selected" : ""}`}
                        onClick={() => toggleSkill(skill)}
                    >
                        {skill}
                    </button>
                ))}
            </div>
            {form.fields.skillInterest && (
                <span className="field-error">{form.fields.skillInterest}</span>
            )}
        </>
    );
}
