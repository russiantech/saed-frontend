export const SKILL_AREAS = [
  "Creative Industry",
  "Automobile",
  "Construction",
  "Agro-Allied",
  "Delivery & Logistics",
  "Culinary & Catering",
  "Cleaning Services",
  "Green Energy & Satellite Security",
  "ICT",
  "Cosmetology",
  "Education",
];

// API values used for trainer specialization and program categories. Keep
// SKILL_AREAS above as display strings for the corps-member multi-select.
export const SKILL_AREA_OPTIONS = [
  { value: "Creative Industry", label: "Creative Industry" },
  { value: "Automobile", label: "Automobile" },
  { value: "Construction", label: "Construction" },
  { value: "Agro-Allied", label: "Agro-Allied" },
  { value: "Delivery & Logistics", label: "Delivery & Logistics" },
  { value: "Culinary & Catering", label: "Culinary & Catering" },
  { value: "Cleaning Services", label: "Cleaning Services" },
  { value: "Green Energy & Satellite Security", label: "Green Energy & Satellite Security" },
  { value: "ICT", label: "ICT" },
  { value: "Cosmetology", label: "Cosmetology" },
  { value: "Education", label: "Education" },
];

export const EXPERIENCE_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

export const VALIDATION = {
  EMAIL: /^\S+@\S+\.\S+$/,
  PHONE: /^[0-9]{10}$/,
  NYSC_CODE: /^[A-Z]{2}\/\d{2}[A-Z]\/\d{4}$/,
  MIN_PASSWORD: 8,
};

export const MESSAGES = {
  FULL_NAME: "Enter first and last name.",
  USERNAME_REQUIRED: "Username is required.",
  EMAIL_INVALID: "Enter a valid email address.",
  PHONE_REQUIRED: "Phone number is required.",
  PHONE_INVALID: "Invalid phone number format.",
  NYSC_FORMAT: "Format: LA/26B/0123",
  LGA_REQUIRED: "Select your LGA.",
  SPECIALIZATION_REQUIRED: "Select a specialization.",
  LGA_MIN: "Select at least one LGA.",
  PARTNERSHIP_REQUIRED: "Partnership letter is required.",
  PASSWORD_MIN: "Use at least 8 characters.",
  PASSWORD_MATCH: "Passwords do not match.",
  SKILL_REQUIRED: "Select a skill interest.",
  AGE_RANGE: "Child must be between 7 and 19 years old.",
};

