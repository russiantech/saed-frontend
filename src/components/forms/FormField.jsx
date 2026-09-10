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
            const raw = e.target.value.replace(/\//g, "").toUpperCase();
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
            const pos = e.target.selectionStart;
            const slashesBefore = (formatted.slice(0, pos).match(/\//g) || []).length;
            const rawPos = pos - slashesBefore;
            requestAnimationFrame(() => {
              const newPos = Math.min(
                Math.min(rawPos, clean.length) +
                (clean.length >= 2 && rawPos >= 2 ? 1 : 0) +
                (clean.length >= 5 && rawPos >= 5 ? 1 : 0),
                formatted.length
              );
              e.target.setSelectionRange(newPos, newPos);
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
              const raw = (value || "").replace(/\//g, "");
              const pos = e.target.selectionStart;
              const slashesBefore = (value || "").slice(0, pos).split("/").length - 1;
              const rawPos = pos - slashesBefore;
              let newRaw;
              if (e.key === "Backspace") {
                if (rawPos === 0) return;
                newRaw = raw.slice(0, rawPos - 1) + raw.slice(rawPos);
              } else {
                if (rawPos >= raw.length) return;
                newRaw = raw.slice(0, rawPos) + raw.slice(rawPos + 1);
              }
              let formatted = "";
              for (let i = 0; i < newRaw.length; i++) {
                formatted += newRaw[i];
                if (i === 1 || i === 4) formatted += "/";
              }
              onChange(name, formatted);
              const newPos = e.key === "Backspace" ? rawPos - 1 : rawPos;
              requestAnimationFrame(() => {
                const adjusted = newPos +
                  (newPos >= 2 && newRaw.length >= 2 ? 1 : 0) +
                  (newPos >= 5 && newRaw.length >= 5 ? 1 : 0);
                e.target.setSelectionRange(adjusted, adjusted);
              });
              return;
            }
            if (e.key.length > 1) return;
            e.preventDefault();
            const input = e.target;
            const raw = (value || "").replace(/\//g, "");
            const pos = input.selectionStart;
            const slashesBefore = (value || "").slice(0, pos).split("/").length - 1;
            const rawPos = pos - slashesBefore;
            if (raw.length >= 9) return;
            const ch = e.key.toUpperCase();
            if (rawPos < 2 && !/[A-Z]/.test(ch)) return;
            if (rawPos >= 2 && rawPos < 4 && !/[0-9]/.test(ch)) return;
            if (rawPos === 4 && !/[A-Z]/.test(ch)) return;
            if (rawPos >= 5 && !/[0-9]/.test(ch)) return;
            const newRaw = raw.slice(0, rawPos) + ch + raw.slice(rawPos);
            let formatted = "";
            for (let i = 0; i < newRaw.length; i++) {
              formatted += newRaw[i];
              if (i === 1 || i === 4) formatted += "/";
            }
            onChange(name, formatted);
            const newPos = rawPos + 1;
            requestAnimationFrame(() => {
              const adjusted = newPos +
                (newPos >= 2 && newRaw.length >= 2 ? 1 : 0) +
                (newPos >= 5 && newRaw.length >= 5 ? 1 : 0);
              input.setSelectionRange(adjusted, adjusted);
            });
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = (e.clipboardData.getData("text") || "").replace(/\//g, "").toUpperCase();
            const raw = (value || "").replace(/\//g, "");
            let clean = "";
            for (let i = 0; i < text.length && clean.length < 9; i++) {
              const ch = text[i];
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

