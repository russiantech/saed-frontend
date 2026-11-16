import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function PasswordInput({ value, onChange, placeholder, required = false, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
      />
      <button
        className="password-eye-button"
        onClick={() => setVisible((current) => !current)}
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
