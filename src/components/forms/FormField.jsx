import { User, GraduationCap, Eye, EyeOff, Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { generateStrongPassword } from "constants/validators.js";

export function FormField({
  label,
  name,
  id,
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
  autoComplete,
  action = null,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const inputProps = {
    id: inputId,
    name,
    value,
    onChange: (e) => onChange(name, e.target.type === "checkbox" ? e.target.checked : e.target.value),
    placeholder,
    required,
    autoComplete,
    ...props,
  };

  return (
    <label htmlFor={inputId}>
      {action ? (
        <span className="field-label-row">
          <span className="field-label-text">{label} {required && "*"}</span>
          {action}
        </span>
      ) : (
        <span>{label} {required && "*"}</span>
      )}
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
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : type === "security-key" ? (
        <div className="password-input-wrap">
          <input
            {...inputProps}
            type="text"
            className={`security-key-input ${showPassword ? "revealed" : ""}`}
            autoComplete={autoComplete || "one-time-code"}
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
          />
          <button
            type="button"
            className="password-eye-button"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword((s) => !s);
            }}
            aria-label={showPassword ? "Hide security key" : "Show security key"}
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
        <input type="file" id={inputId} name={name} accept={accept} onChange={(e) => onChange(name, e.target.files?.[0] || null)} />
      ) : type === "checkbox" ? (
        <input type="checkbox" id={inputId} name={name} checked={value} onChange={(e) => onChange(name, e.target.checked)} />
      ) : type === "phone" ? (
        <div className="phone-input-wrap">
          <span className="phone-prefix">+234</span>
          <input
            id={inputId}
            name={name}
            type="tel"
            autoComplete={autoComplete || "tel-national"}
            value={(value || "").replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "").slice(0, 10)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
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
export function SubmitButton({ loading, children, disabled = false, onClick, type = "submit" }) {
  return (
    <button className="wide-button" type={type} disabled={loading || disabled} onClick={onClick}>
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

// Suggest Password Button
export function SuggestPasswordButton({ onGenerate, label = "Suggest strong password" }) {
  const [copied, setCopied] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pwd = generateStrongPassword();
    if (onGenerate) onGenerate(pwd);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(pwd).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      className={`btn-suggest-password ${copied ? "copied" : ""}`}
      onClick={handleClick}
      title="Generate a cryptographically secure 16-character password and copy it to clipboard"
    >
      {copied ? (
        <>
          <Check size={13} className="suggest-icon" />
          <span>Password filled & copied!</span>
        </>
      ) : (
        <>
          <Sparkles size={13} className="suggest-icon" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}


