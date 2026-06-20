import { useState, useCallback } from "react";

export default function useAuthForm(initialState = {}) {
  const [form, setForm] = useState(initialState);
  const [fields, setFields] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user types
    setFields((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setFieldErrors = useCallback((errors) => {
    setFields(errors);
  }, []);

  const clearErrors = useCallback(() => {
    setFields({});
    setError("");
  }, []);

  const startSubmit = useCallback(() => {
    setSubmitting(true);
    setError("");
  }, []);

  const endSubmit = useCallback(() => {
    setSubmitting(false);
  }, []);

  const setSubmitError = useCallback((err) => {
    setFields(err.data?.fields || {});
    setError(err.message || "Something went wrong. Please try again.");
  }, []);

  return {
    form,
    fields,
    error,
    submitting,
    update,
    setFieldErrors,
    clearErrors,
    startSubmit,
    endSubmit,
    setSubmitError,
  };
}
