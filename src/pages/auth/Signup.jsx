import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "lib/auth.jsx";
import { api } from "lib/api.js";
import AuthLayout from "components/auth/AuthLayout.jsx";
import AuthError from "components/auth/AuthError.jsx";
import { RoleSelector, FormField, FormRow, SubmitButton, StepIndicator, TermsCheckbox } from "components/forms/FormField.jsx";
import useAuthForm from "hooks/useAuthForm.js";
import useToggleArray from "hooks/useToggleArray.js";
import { validateFullName, validateEmail, validatePhone, validateUsername, validatePassword, validateNyscCode, validateRequired } from "constants/validators.js";
import { SKILL_AREAS, MESSAGES } from "constants/constants.js";
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
    const [role, setRole] = useState("corps_member");
    const [step, setStep] = useState(1);
    const [agree, setAgree] = useState(false);

    const { form: formData, fields, error, submitting, update, setFieldErrors, startSubmit, endSubmit, setSubmitError } = useAuthForm(INITIAL_FORM);
    const [partnerLgas, toggleLga] = useToggleArray();

    const isTrainer = role === "trainer";

    function validateStep1() {
        const errors = {};
        const nameErr = validateFullName(formData.fullName);
        if (nameErr) errors.fullName = nameErr;

        const usernameErr = validateUsername(formData.username);
        if (usernameErr) errors.username = usernameErr;

        const emailErr = validateEmail(formData.email);
        if (emailErr) errors.email = emailErr;

        const phoneErr = validatePhone(formData.phone);
        if (phoneErr) errors.phone = phoneErr;

        const pwErrors = validatePassword(formData.password, formData.confirmPassword);
        Object.assign(errors, pwErrors);
        return errors;
    }

    function validateStep2Corps() {
        const errors = {};
        const codeErr = validateNyscCode(formData.nyscStateCode);
        if (codeErr) errors.nyscStateCode = codeErr;

        const lgaErr = validateRequired(formData.lgaOfDeployment, MESSAGES.LGA_REQUIRED);
        if (lgaErr) errors.lgaOfDeployment = MESSAGES.LGA_REQUIRED;

        if (!formData.skillInterests || formData.skillInterests.length === 0) {
            errors.skillInterest = MESSAGES.SKILL_REQUIRED;
        }
        return errors;
    }

    function validateStep2Trainer() {
        const errors = {};
        const specErr = validateRequired(formData.specialization, MESSAGES.SPECIALIZATION_REQUIRED);
        if (specErr) errors.specialization = MESSAGES.SPECIALIZATION_REQUIRED;

        const lgaErr = validateRequired(partnerLgas, MESSAGES.LGA_MIN);
        if (lgaErr) errors.partnerLgas = MESSAGES.LGA_MIN;

        const letterErr = validateRequired(formData.partnershipLetter, MESSAGES.PARTNERSHIP_REQUIRED);
        if (letterErr) errors.partnershipLetter = MESSAGES.PARTNERSHIP_REQUIRED;
        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (step === 1) {
            const errors = validateStep1();
            setFieldErrors(errors);
            if (Object.keys(errors).length > 0) return;

            startSubmit();
            try {
                const data = await api("/auth/validate-signup/", {
                    method: "POST",
                    body: {
                        fullName: formData.fullName,
                        username: formData.username,
                        email: formData.email,
                        phone: formData.phone,
                    },
                });

                setStep(2);
            } catch (err) {
                if (err.data?.fields) {
                    setFieldErrors(err.data.fields);
                    const fieldMessages = Object.values(err.data.fields).join(". ");
                    setSubmitError(new Error(fieldMessages));
                } else {
                    setSubmitError(err);
                }
            } finally {
                endSubmit();
            }
            return;
        }

        const errors = isTrainer ? validateStep2Trainer() : validateStep2Corps();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        startSubmit();

        try {
            if (isTrainer) {
                const fd = new FormData();

                Object.entries(formData).forEach(([key, value]) => {
                    if (key === "partnerLgas") {
                        fd.append(key, JSON.stringify(partnerLgas));
                    } else if (key === "partnershipLetter" && value instanceof File) {
                        fd.append(key, value);
                    } else if (value !== null && value !== undefined && value !== "") {
                        fd.append(key, value);
                    }
                });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const data = await api("/auth/trainer-signup/", {
                    method: "POST",
                    body: fd,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!data.user) {
                    throw new Error("Invalid response from server. Please try again.");
                }

                navigate("/trainer-signup-success");
            } else {
                await signup({
                    ...formData,
                    role: "corps_member",
                    stateOfDeployment: "Lagos",
                    skillInterests: formData.skillInterests || [],
                });
                navigate("/app");
            }
        } catch (err) {
            if (err.name === "AbortError") {
                setSubmitError(
                    new Error("Request timed out. The server took too long to respond. Please try again.")
                );
            } else {
                setSubmitError(err);
            }
        } finally {
            endSubmit();
        }
    }

    const subtitle = step === 1
        ? "Choose your role and enter your personal details"
        : isTrainer
            ? "Complete your trainer profile"
            : "Select your skills and deployment info";

    return (
        <AuthLayout title="Create Your Account" subtitle={subtitle}>
            <StepIndicator current={step} total={2} />

            {step === 1 && (
                <RoleSelector
                    value={role}
                    onChange={(r) => setRole(r)}
                />
            )}

            <form className="auth-form" onSubmit={handleSubmit} encType="multipart/form-data">
                {step === 1 ? (
                    <PersonalInfo form={formData} fields={fields} update={update} />
                ) : isTrainer ? (
                    <TrainerStep2 form={formData} fields={fields} update={update} lgas={partnerLgas} toggleLga={toggleLga} />
                ) : (
                    <CorpsStep2 form={formData} fields={fields} update={update} />
                )}

                <AuthError message={error} />

                {step === 2 && (
                    <TermsCheckbox checked={agree} onChange={setAgree} />
                )}

                <SubmitButton
                    loading={submitting}
                    disabled={step === 2 && !agree}
                >
                    {step === 1 ? "Continue to Next Step →" : isTrainer ? "Create Trainer Account →" : "Create Account →"}
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

function PersonalInfo({ form, fields, update }) {
    return (
        <>
            <div className="form-section-title">PERSONAL INFORMATION</div>

            <FormField
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={update}
                error={fields.fullName}
                placeholder="Enter your full name"
                required
            />
            <FormField
                label="Username"
                name="username"
                value={form.username}
                onChange={update}
                error={fields.username}
                placeholder="Choose a username"
                required
            />

            <FormRow>
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
                <FormField
                    label="Phone Number"
                    name="phone"
                    type="phone"
                    value={form.phone}
                    onChange={update}
                    error={fields.phone}
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
                    value={form.password}
                    onChange={update}
                    error={fields.password}
                    placeholder="Create a password"
                    minLength={8}
                    required
                />
                <FormField
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={update}
                    error={fields.confirmPassword}
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

function CorpsStep2({ form, fields, update }) {
    function toggleSkill(skill) {
        const current = form.skillInterests || [];
        const next = current.includes(skill)
            ? current.filter((s) => s !== skill)
            : [...current, skill];
        update("skillInterests", next);
        if (next.length > 0) {
            update("skillInterest", next[0]);
        } else {
            update("skillInterest", "");
        }
    }

    return (
        <>
            <div className="form-section-title">DEPLOYMENT & SKILLS</div>

            <FormField
                label="State Code"
                name="nyscStateCode"
                value={form.nyscStateCode}
                onChange={update}
                error={fields.nyscStateCode}
                placeholder="LA/26B/0123"
                required
            />

            <FormField
                label="LGA"
                name="lgaOfDeployment"
                type="select"
                value={form.lgaOfDeployment}
                onChange={update}
                error={fields.lgaOfDeployment}
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
                        className={`skill-card ${(form.skillInterests || []).includes(skill) ? "selected" : ""}`}
                        onClick={() => toggleSkill(skill)}
                    >
                        {skill}
                    </button>
                ))}
            </div>
            {fields.skillInterest && (
                <span className="field-error">{fields.skillInterest}</span>
            )}
        </>
    );
}

function TrainerStep2({ form, fields, update, lgas, toggleLga }) {
    return (
        <>
            <div className="form-section-title">TRAINER PROFILE</div>

            <FormField
                label="Specialization / Skill Area"
                name="specialization"
                type="select"
                value={form.specialization}
                onChange={update}
                error={fields.specialization}
                placeholder="Select your Skill Area"
                options={SKILL_AREAS}
                required
            />

            <FormRow>
                <FormField
                    label="Years of Experience"
                    name="yearsExperience"
                    type="number"
                    value={form.yearsExperience}
                    onChange={update}
                    placeholder="e.g. 5"
                    min="0"
                    max="50"
                    required
                />
                <FormField
                    label="Company Name"
                    name="companyName"
                    value={form.companyName}
                    onChange={update}
                    placeholder="Enter your company name"
                />
            </FormRow>

            <label className="form-label lga-label">
                <span>Select Your Approved LGAs *</span>
                <span className="section-hint">select one or more</span>
                <div className="lga-checkboxes">
                    {LAGOS_LGAS.map((lga) => (
                        <label key={lga} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={lgas.includes(lga)}
                                onChange={() => toggleLga(lga)}
                            />
                            {lga}
                        </label>
                    ))}
                </div>
            </label>
            {fields.partnerLgas && (
                <span className="field-error">{fields.partnerLgas}</span>
            )}

            <FormField
                label="Brief Bio / About"
                name="bio"
                type="textarea"
                value={form.bio}
                onChange={update}
                placeholder="Tell us about yourself (20-500 characters)"
                rows={3}
            />

            <FormField
                label="Number of Trained"
                name="numberTrained"
                type="number"
                value={form.numberTrained}
                onChange={update}
                placeholder="Enter No of Trained Student"
            />

            <FormField
                label="Partnership Letter (PDF / Image)"
                name="partnershipLetter"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={update}
                error={fields.partnershipLetter}
                required
            />
        </>
    );
}
