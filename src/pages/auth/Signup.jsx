import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "lib/auth.jsx";
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

function safeJsonParse(text) {
    try {
        return { data: JSON.parse(text), error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

async function extractError(response, fallbackMessage = "Request failed") {
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
        try {
            const data = await response.json();
            return data.error || data.message || fallbackMessage;
        } catch {
        }
    }
    
    try {
        const text = await response.text();
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
            const { data, error } = safeJsonParse(text);
            if (!error && data) {
                return data.error || data.message || fallbackMessage;
            }
        }
        if (text && text.length < 200) {
            return text;
        }
    } catch {
    }
    
    return fallbackMessage;
}

function getStatusErrorMessage(status) {
    const messages = {
        400: "Invalid request. Please check your input and try again.",
        401: "Authentication required. Please log in.",
        403: "You don't have permission to perform this action.",
        404: "The requested resource was not found.",
        405: "This action is not allowed. Please contact support.",
        408: "Request timed out. Please check your connection and try again.",
        413: "The uploaded file is too large.",
        429: "Too many requests. Please wait a moment and try again.",
        500: "Server error. Please try again later.",
        502: "Service temporarily unavailable. Please try again later.",
        503: "Service temporarily unavailable. Please try again later.",
        504: "Request timed out. The server took too long to respond. Please try again.",
    };
    return messages[status] || `Request failed with status ${status}`;
}

export default function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [role, setRole] = useState("corps_member");
    const [step, setStep] = useState(1);
    const [agree, setAgree] = useState(false);

    const form = useAuthForm(INITIAL_FORM);
    const [partnerLgas, toggleLga] = useToggleArray();

    const isTrainer = role === "trainer";

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

    function validateStep2Trainer() {
        const errors = {};
        const specErr = validateRequired(form.form.specialization, MESSAGES.SPECIALIZATION_REQUIRED);
        if (specErr) errors.specialization = MESSAGES.SPECIALIZATION_REQUIRED;
        
        const lgaErr = validateRequired(partnerLgas, MESSAGES.LGA_MIN);
        if (lgaErr) errors.partnerLgas = MESSAGES.LGA_MIN;
        
        const letterErr = validateRequired(form.form.partnershipLetter, MESSAGES.PARTNERSHIP_REQUIRED);
        if (letterErr) errors.partnershipLetter = MESSAGES.PARTNERSHIP_REQUIRED;
        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (step === 1) {
            const errors = validateStep1();
            form.setFieldErrors(errors);
            if (Object.keys(errors).length > 0) return;
            setStep(2);
            return;
        }

        const errors = isTrainer ? validateStep2Trainer() : validateStep2Corps();
        form.setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        form.startSubmit();

        try {
            if (isTrainer) {
                const formData = new FormData();
                
                Object.entries(form.form).forEach(([key, value]) => {
                    if (key === "partnerLgas") {
                        formData.append(key, JSON.stringify(partnerLgas));
                    } else if (key === "partnershipLetter" && value instanceof File) {
                        formData.append(key, value);
                    } else if (value !== null && value !== undefined && value !== "") {
                        formData.append(key, value);
                    }
                });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const res = await fetch("/api/auth/trainer-signup/", {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                    signal: controller.signal,
                });
                
                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorMessage = await extractError(res, getStatusErrorMessage(res.status));
                    const err = new Error(errorMessage);
                    err.status = res.status;
                    err.data = { error: errorMessage, status: res.status };
                    throw err;
                }

                const data = await res.json();
                
                if (!data.user) {
                    throw new Error("Invalid response from server. Please try again.");
                }

                navigate("/trainer-signup-success");
            } else {
                await signup({ 
                    ...form.form, 
                    role: "corps_member", 
                    stateOfDeployment: "Lagos",
                    skillInterests: form.form.skillInterests || [],
                });
                navigate("/app");
            }
        } catch (err) {
            if (err.name === "AbortError") {
                form.setSubmitError(
                    new Error("Request timed out. The server took too long to respond. Please try again.")
                );
            } else {
                form.setSubmitError(err);
            }
        } finally {
            form.endSubmit();
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
                    <PersonalInfo form={form} />
                ) : isTrainer ? (
                    <TrainerStep2 form={form} lgas={partnerLgas} toggleLga={toggleLga} />
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

function TrainerStep2({ form, lgas, toggleLga }) {
    return (
        <>
            <div className="form-section-title">TRAINER PROFILE</div>

            <FormField
                label="Specialization / Skill Area"
                name="specialization"
                type="select"
                value={form.form.specialization}
                onChange={form.update}
                error={form.fields.specialization}
                placeholder="Select your Skill Area"
                options={SKILL_AREAS}
                required
            />

            <FormRow>
                <FormField
                    label="Years of Experience"
                    name="yearsExperience"
                    type="number"
                    value={form.form.yearsExperience}
                    onChange={form.update}
                    placeholder="e.g. 5"
                    min="0"
                    max="50"
                    required
                />
                <FormField
                    label="Company Name"
                    name="companyName"
                    value={form.form.companyName}
                    onChange={form.update}
                    placeholder="Enter your company name"
                />
            </FormRow>

            <label className="form-label lga-label">
                <span>Local Government Area *</span>
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
            {form.fields.partnerLgas && (
                <span className="field-error">{form.fields.partnerLgas}</span>
            )}

            <FormField
                label="Brief Bio / About"
                name="bio"
                type="textarea"
                value={form.form.bio}
                onChange={form.update}
                placeholder="Tell us about yourself (20-500 characters)"
                rows={3}
            />

            <FormField
                label="Number of Trained"
                name="numberTrained"
                type="number"
                value={form.form.numberTrained}
                onChange={form.update}
                placeholder="Enter No of Trained Student"
            />

            <FormField
                label="Partnership Letter (PDF / Image)"
                name="partnershipLetter"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={form.update}
                error={form.fields.partnershipLetter}
                required
            />
        </>
    );
}
