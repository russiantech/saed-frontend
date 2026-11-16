import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkToggle({ className }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("saed_dark");
      if (saved !== null) {
        const v = saved === "true";
        setDark(v);
        document.documentElement.classList.toggle("dark", v);
      } else if (window.matchMedia) {
        const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(prefers);
        document.documentElement.classList.toggle("dark", prefers);
      }
    } catch (err) {
      // ignore
    }

    function onStorage(e) {
      if (e.key === "saed_dark") {
        const v = e.newValue === "true";
        setDark(v);
        try {
          document.documentElement.classList.toggle("dark", v);
        } catch (err) {}
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", dark);
      localStorage.setItem("saed_dark", dark);
    } catch (err) {
      // ignore
    }
  }, [dark]);

  return (
    <button
      className={(className ? className + " " : "") + "theme-toggle"}
      aria-label="Toggle dark mode"
      aria-pressed={dark}
      onClick={() => setDark((v) => !v)}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
