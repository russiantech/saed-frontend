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
      ) : type === "phone" ? (
        <div className="phone-input-wrap">
          <span className="phone-prefix">+234</span>
          <input
            type="tel"
            value={(value || "").replace(/\D/g, "").replace(/^234/, "").slice(0, 10)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").replace(/^234/, "");
              if (digits.length <= 10) onChange(name, digits);
            }}
            placeholder={placeholder || "8012345678"}
            maxLength={10}
            inputMode="numeric"
          />
        </div>
      ) : type === "nysc-code" ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => {
            const prev = (value || "").replace(/\//g, "");
            const next = e.target.value.replace(/\//g, "").toUpperCase();
            const added = next.length > prev.length;
            let raw = added ? next.slice(0, next.length) : next;
            let clean = "";
            for (let i = 0; i < raw.length && clean.length < 9; i++) {
              const ch = raw[i];
              if (clean.length < 2 && /[A-Z]/.test(ch)) clean += ch;
              else if (clean.length >= 2 && clean.length < 4 && /[0-9]/.test(ch)) clean += ch;
              else if (clean.length === 4 && /[A-Z]/.test(ch)) clean += ch;
              else if (clean.length >= 5 && clean.length < 9 && /[0-9]/.test(ch)) clean += ch;
            }
            let formatted = "";
            for (let i = 0; i < clean.length; i++) {
              formatted += clean[i];
              if (i === 1 || i === 4) formatted += "/";
            }
            onChange(name, formatted);
          }}
          placeholder={placeholder || "LA/26B/0123"}
          maxLength={11}
          inputMode="text"
          autoComplete="off"
        />
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
    <div className="agree-label">
      <label className="checkbox-clickable">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
        <span className="checkbox-custom"></span>
      </label>
      <span>I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></span>
    </div>
  );
}

