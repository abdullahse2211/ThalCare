/**
 * ThalCare Utility Functions
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS, RISK_CATEGORIES, RISK_CATEGORY_COLORS } from '../constants';

// ============================================
// Date Utilities
// ============================================
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, formatStr) : '-';
};

export const formatDateTime = (date) => {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? formatDistanceToNow(parsedDate, { addSuffix: true }) : '-';
};

export const getAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ============================================
// String Utilities
// ============================================
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatName = (firstName, lastName) => {
  return [firstName, lastName].filter(Boolean).map(capitalize).join(' ');
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// ============================================
// Number Utilities
// ============================================
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return Number(num).toFixed(decimals);
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatCurrency = (amount, currency = 'PKR') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

// ============================================
// Validation Utilities
// ============================================
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-+()]{10,15}$/;
  return phoneRegex.test(phone);
};

export const isValidCNIC = (cnic) => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};

// ============================================
// Risk Category Utilities
// ============================================
export const getRiskCategoryColor = (category) => {
  return RISK_CATEGORY_COLORS[category] || RISK_CATEGORY_COLORS[RISK_CATEGORIES.NOT_DETECTED];
};

export const getRiskCategoryBadgeClass = (category) => {
  const colors = getRiskCategoryColor(category);
  return `${colors.bg} ${colors.text}`;
};

export const getRiskSeverityScore = (category) => {
  const scores = {
    [RISK_CATEGORIES.NOT_DETECTED]: 0,
    [RISK_CATEGORIES.CARRIER]: 1,
    [RISK_CATEGORIES.MINOR]: 2,
    [RISK_CATEGORIES.MAJOR]: 3,
    [RISK_CATEGORIES.SEVERE]: 4,
  };
  return scores[category] ?? 0;
};

// ============================================
// CBC/HPLC Value Utilities
// ============================================
export const isValueInRange = (value, min, max) => {
  if (value === null || value === undefined) return null;
  return value >= min && value <= max;
};

export const getValueStatus = (value, min, max) => {
  if (value === null || value === undefined) return 'unknown';
  if (value < min) return 'low';
  if (value > max) return 'high';
  return 'normal';
};

export const getValueStatusColor = (status) => {
  const colors = {
    low: 'text-blue-600',
    high: 'text-red-600',
    normal: 'text-green-600',
    unknown: 'text-gray-400',
  };
  return colors[status] || colors.unknown;
};

// ============================================
// File Utilities
// ============================================
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isAllowedFileType = (file, allowedTypes) => {
  const extension = `.${getFileExtension(file.name).toLowerCase()}`;
  return allowedTypes.includes(extension);
};

// ============================================
// Object Utilities
// ============================================
export const removeEmptyValues = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

export const omit = (obj, keys) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
};

// ============================================
// Array Utilities
// ============================================
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] ?? [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = (array, key) => {
  return [...new Map(array.map((item) => [item[key], item])).values()];
};

// ============================================
// Storage Utilities
// ============================================
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// ============================================
// Debounce & Throttle
// ============================================
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// ============================================
// URL Utilities
// ============================================
export const buildQueryString = (params) => {
  const cleanParams = removeEmptyValues(params);
  return new URLSearchParams(cleanParams).toString();
};

export const parseQueryString = (queryString) => {
  return Object.fromEntries(new URLSearchParams(queryString));
};

// ============================================
// Class Name Utilities
// ============================================
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getAge,
  capitalize,
  formatName,
  truncate,
  slugify,
  generateId,
  formatNumber,
  formatPercentage,
  formatCurrency,
  clamp,
  isValidEmail,
  isValidPhone,
  isValidCNIC,
  getRiskCategoryColor,
  getRiskCategoryBadgeClass,
  getRiskSeverityScore,
  isValueInRange,
  getValueStatus,
  getValueStatusColor,
  formatFileSize,
  getFileExtension,
  isAllowedFileType,
  removeEmptyValues,
  deepClone,
  pick,
  omit,
  groupBy,
  sortBy,
  uniqueBy,
  storage,
  debounce,
  throttle,
  buildQueryString,
  parseQueryString,
  cn,
};
