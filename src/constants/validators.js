import { VALIDATION, MESSAGES } from "./constants.js";

export function validateFullName(name) {
  if (!name?.trim() || name.trim().split(/\s+/).length < 2) {
    return MESSAGES.FULL_NAME;
  }
  return null;
}

export function validateEmail(email) {
  if (!email?.trim()) return "Email is required.";
  if (!VALIDATION.EMAIL.test(email)) return MESSAGES.EMAIL_INVALID;
  return null;
}

export function validatePhone(phone) {
  if (!phone?.trim()) return MESSAGES.PHONE_REQUIRED;
  if (!VALIDATION.PHONE.test(phone.replace(/\D/g, ""))) return MESSAGES.PHONE_INVALID;
  return null;
}

export function validateUsername(username) {
  if (!username?.trim()) return MESSAGES.USERNAME_REQUIRED;
  return null;
}

export function validatePassword(password, confirmPassword) {
  const errors = {};
  if (!password || password.length < VALIDATION.MIN_PASSWORD) {
    errors.password = MESSAGES.PASSWORD_MIN;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = MESSAGES.PASSWORD_MATCH;
  }
  return errors;
}

export function validateNyscCode(code) {
  if (!VALIDATION.NYSC_CODE.test(code)) return MESSAGES.NYSC_FORMAT;
  return null;
}

export function validateRequired(value, message) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return message;
  }
  return null;
}

