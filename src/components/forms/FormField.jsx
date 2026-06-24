import { User, GraduationCap, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options = null,
  rows = 3,
  accept = null,
  minLength,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputProps = {
    value,
    onChange: (e) => onChange(name, e.target.type === "checkbox" ? e.target.checked : e.target.value),
    placeholder,
    required,
    ...props,
  };

  return (
    <label>
      {label} {required && "*"}
      {type === "password" ? (
        <div className="password-input-wrap">
          <input
            type={showPassword ? "text" : "password"}
            {...inputProps}
            minLength={minLength}
          />
          <button
            type="button"
            className="password-eye-button"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : type === "select" ? (
        <select {...inputProps}>
          <option value="">{placeholder || "Select..."}</option>
          {options?.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>{opt}</option>
            ) : (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea {...inputProps} rows={rows} />
      ) : type === "file" ? (
        <input type="file" accept={accept} onChange={(e) => onChange(name, e.target.files?.[0] || null)} />
      ) : type === "checkbox" ? (
        <input type="checkbox" checked={value} onChange={(e) => onChange(name, e.target.checked)} />
      ) : (
        <input type={type} {...inputProps} />
      )}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

// FormRow
export function FormRow({ children }) {
  return <div className="form-row">{children}</div>;
}

// RoleSelector
const ROLES = [
  { key: "corps_member", label: "I'm a Corps Member", icon: User },
  { key: "trainer", label: "I'm a Trainer", icon: GraduationCap },
];

export function RoleSelector({ value, onChange }) {
  return (
    <div className="role-selector">
      {ROLES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          className={`role-card ${value === key ? "selected" : ""}`}
          onClick={() => onChange(key)}
        >
          <Icon size={24} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

// StepIndicator
export function StepIndicator({ current, total }) {
  return (
    <div className="step-bars">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < current ? "filled" : ""} />
      ))}
    </div>
  );
}

// Submit Button
export function SubmitButton({ loading, children, disabled = false }) {
  return (
    <button className="wide-button" type="submit" disabled={loading || disabled}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

// TermsCheckbox
export function TermsCheckbox({ checked, onChange }) {
  return (
    <label className="checkbox-label agree-label">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span className="checkbox-custom"></span>
      <span>I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></span>
    </label>
  );
}

