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
  { value: "creative_industry", label: "Creative Industry" },
  { value: "automobile", label: "Automobile" },
  { value: "construction", label: "Construction" },
  { value: "agro_allied", label: "Agro-Allied" },
  { value: "delivery_logistics", label: "Delivery & Logistics" },
  { value: "culinary_catering", label: "Culinary & Catering" },
  { value: "cleaning_services", label: "Cleaning Services" },
  { value: "green_energy_satellite_security", label: "Green Energy & Satellite Security" },
  { value: "ict", label: "ICT" },
  { value: "cosmetology", label: "Cosmetology" },
  { value: "education", label: "Education" },
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

