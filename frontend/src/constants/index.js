/**
 * ThalCare Constants and Configuration
 */

// ============================================
// User Roles
// ============================================
export const USER_ROLES = {
  DOCTOR: 'doctor',
  LAB_TECHNICIAN: 'lab_technician',
  ADMIN: 'admin',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.DOCTOR]: 'Doctor/Hematologist',
  [USER_ROLES.LAB_TECHNICIAN]: 'Lab Technician',
  [USER_ROLES.ADMIN]: 'System Admin',
};

// ============================================
// Thalassemia Clinical Labels (5 Classes)
// ============================================
export const RISK_CATEGORIES = {
  ALPHA_TRAIT: 'alpha_trait',
  SILENT_CARRIER: 'silent_carrier',
  IRON_DEFICIENCY: 'iron_deficiency',
  INFECTION_OTHER: 'infection_other',
  NORMAL: 'normal',
};

export const RISK_CATEGORY_LABELS = {
  [RISK_CATEGORIES.ALPHA_TRAIT]: 'Alpha Trait',
  [RISK_CATEGORIES.SILENT_CARRIER]: 'Silent Carrier',
  [RISK_CATEGORIES.IRON_DEFICIENCY]: 'Iron Deficiency (IDA)',
  [RISK_CATEGORIES.INFECTION_OTHER]: 'Infection / Inflammation',
  [RISK_CATEGORIES.NORMAL]: 'Normal',
};

export const RISK_CATEGORY_COLORS = {
  [RISK_CATEGORIES.ALPHA_TRAIT]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  [RISK_CATEGORIES.SILENT_CARRIER]: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  [RISK_CATEGORIES.IRON_DEFICIENCY]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  [RISK_CATEGORIES.INFECTION_OTHER]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  [RISK_CATEGORIES.NORMAL]: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

// ============================================
// Test Status
// ============================================
export const TEST_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  PREDICTION_DONE: 'prediction_done',
  FINALIZED: 'finalized',
  REJECTED: 'rejected',
};

export const TEST_STATUS_LABELS = {
  [TEST_STATUS.PENDING]: 'Pending Verification',
  [TEST_STATUS.VERIFIED]: 'Verified',
  [TEST_STATUS.PREDICTION_DONE]: 'Prediction Complete',
  [TEST_STATUS.FINALIZED]: 'Finalized',
  [TEST_STATUS.REJECTED]: 'Rejected',
};

export const TEST_STATUS_COLORS = {
  [TEST_STATUS.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  [TEST_STATUS.VERIFIED]: { bg: 'bg-blue-100', text: 'text-blue-800' },
  [TEST_STATUS.PREDICTION_DONE]: { bg: 'bg-purple-100', text: 'text-purple-800' },
  [TEST_STATUS.FINALIZED]: { bg: 'bg-green-100', text: 'text-green-800' },
  [TEST_STATUS.REJECTED]: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ============================================
// CBC Parameters
// ============================================
export const CBC_PARAMETERS = [
  { key: 'rbc', label: 'RBC (Red Blood Cells)', unit: 'million/µL', min: 4.5, max: 5.5 },
  { key: 'hgb', label: 'Hemoglobin (Hgb)', unit: 'g/dL', min: 12, max: 17 },
  { key: 'hct', label: 'Hematocrit (Hct)', unit: '%', min: 36, max: 50 },
  { key: 'mcv', label: 'MCV (Mean Corpuscular Volume)', unit: 'fL', min: 80, max: 100 },
  { key: 'mch', label: 'MCH (Mean Corpuscular Hemoglobin)', unit: 'pg', min: 27, max: 33 },
  { key: 'mchc', label: 'MCHC', unit: 'g/dL', min: 32, max: 36 },
  { key: 'rdw', label: 'RDW (Red Cell Distribution Width)', unit: '%', min: 11.5, max: 14.5 },
  { key: 'plt', label: 'Platelet Count', unit: 'thousand/µL', min: 150, max: 400 },
  { key: 'wbc', label: 'WBC (White Blood Cells)', unit: 'thousand/µL', min: 4.5, max: 11 },
  { key: 'neut', label: 'Neutrophils', unit: '%', min: 40, max: 70 },
];

// ============================================
// HPLC Parameters
// ============================================
export const HPLC_PARAMETERS = [
  { key: 'hba', label: 'HbA (Adult Hemoglobin)', unit: '%', min: 95, max: 98 },
  { key: 'hba2', label: 'HbA2', unit: '%', min: 2.0, max: 3.5 },
  { key: 'hbf', label: 'HbF (Fetal Hemoglobin)', unit: '%', min: 0, max: 2 },
  { key: 'hbs', label: 'HbS', unit: '%', min: 0, max: 0 },
  { key: 'hbc', label: 'HbC', unit: '%', min: 0, max: 0 },
  { key: 'hbe', label: 'HbE', unit: '%', min: 0, max: 0 },
  { key: 'hbh', label: 'HbH', unit: '%', min: 0, max: 0 },
  { key: 'hb_barts', label: "Hb Bart's", unit: '%', min: 0, max: 0 },
];

// ============================================
// Gender Options
// ============================================
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// ============================================
// Blood Groups
// ============================================
export const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

// ============================================
// DNA Test Recommendation Rules
// ============================================
export const DNA_RECOMMENDATION_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.85,
  MEDIUM_CONFIDENCE: 0.75,
  LOW_CONFIDENCE: 0.60,
};

// ============================================
// File Upload Configuration
// ============================================
export const FILE_UPLOAD_CONFIG = {
  maxSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || '.csv,.pdf,.xlsx').split(','),
  allowedMimeTypes: [
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
};

// ============================================
// Pagination Defaults
// ============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

// ============================================
// Chart Colors
// ============================================
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  carrier: '#22c55e',
  minor: '#eab308',
  major: '#f97316',
  severe: '#ef4444',
};

// ============================================
// Date Formats
// ============================================
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  INPUT: 'yyyy-MM-dd',
  API: "yyyy-MM-dd'T'HH:mm:ss",
  TIME_ONLY: 'hh:mm a',
};

// ============================================
// Navigation Items by Role
// ============================================
export const NAVIGATION_ITEMS = {
  [USER_ROLES.DOCTOR]: [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/doctor/patients', label: 'Patients', icon: 'Users' },
    { path: '/doctor/pending-tests', label: 'Pending Tests', icon: 'Clock' },
    { path: '/doctor/predictions', label: 'Predictions', icon: 'Activity' },
    { path: '/doctor/analytics', label: 'Analytics', icon: 'BarChart3' },
    { path: '/doctor/settings', label: 'Settings', icon: 'Settings' },
  ],
  [USER_ROLES.LAB_TECHNICIAN]: [
    { path: '/lab/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/lab/patients', label: 'Register Patient', icon: 'UserPlus' },
    { path: '/lab/upload', label: 'Upload Reports', icon: 'Upload' },
    { path: '/lab/tests', label: 'Test History', icon: 'FileText' },
    { path: '/lab/settings', label: 'Settings', icon: 'Settings' },
  ],
  [USER_ROLES.ADMIN]: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/users', label: 'User Management', icon: 'Users' },
    { path: '/admin/config', label: 'Configuration', icon: 'Cog' },
    { path: '/admin/logs', label: 'Audit Logs', icon: 'FileText' },
    { path: '/admin/settings', label: 'Settings', icon: 'Settings' },
  ],
};

export default {
  USER_ROLES,
  USER_ROLE_LABELS,
  RISK_CATEGORIES,
  RISK_CATEGORY_LABELS,
  RISK_CATEGORY_COLORS,
  TEST_STATUS,
  TEST_STATUS_LABELS,
  TEST_STATUS_COLORS,
  CBC_PARAMETERS,
  HPLC_PARAMETERS,
  GENDER_OPTIONS,
  BLOOD_GROUPS,
  DNA_RECOMMENDATION_THRESHOLDS,
  FILE_UPLOAD_CONFIG,
  PAGINATION,
  CHART_COLORS,
  DATE_FORMATS,
  NAVIGATION_ITEMS,
};
