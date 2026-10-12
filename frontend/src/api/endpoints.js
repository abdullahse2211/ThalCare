/**
 * ThalCare API Endpoints
 * All API endpoints organized by feature/module
 */

import { apiClient } from './client';

// ============================================
// Authentication API
// ============================================
export const authAPI = {
  login: (credentials) =>
    apiClient.post('/auth/login', credentials),

  logout: () =>
    apiClient.post('/auth/logout'),

  register: (userData) =>
    apiClient.post('/auth/register', userData),

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) =>
    apiClient.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword, newPassword) =>
    apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    }),

  getProfile: () =>
    apiClient.get('/auth/profile'),

  updateProfile: (data) =>
    apiClient.put('/auth/profile', data),
};

// ============================================
// Patient Management API
// ============================================
export const patientAPI = {
  // Get all patients with pagination and filters
  getAll: (params = {}) =>
    apiClient.get('/patients', { params }),

  // Get single patient by ID
  getById: (id) =>
    apiClient.get(`/patients/${id}`),

  // Create new patient
  create: (patientData) =>
    apiClient.post('/patients', patientData),

  // Update patient
  update: (id, patientData) =>
    apiClient.put(`/patients/${id}`, patientData),

  // Delete patient
  delete: (id) =>
    apiClient.delete(`/patients/${id}`),

  // Get patients with pending/no tests (for Pending Tests page)
  getPendingTest: () =>
    apiClient.get('/patients/pending-test'),

  // Search patients
  search: (query) =>
    apiClient.get('/patients/search', { params: { q: query } }),

  // Get patient test history
  getTestHistory: (id) =>
    apiClient.get(`/patients/${id}/tests`),

  // Get patient predictions history
  getPredictionHistory: (id) =>
    apiClient.get(`/patients/${id}/predictions`),
};

// ============================================
// Test Management API
// ============================================
export const testAPI = {
  // Get all tests
  getAll: (params = {}) =>
    apiClient.get('/tests', { params }),

  // Get single test
  getById: (id) =>
    apiClient.get(`/tests/${id}`),

  // Create new CBC/HPLC test
  create: (testData) =>
    apiClient.post('/tests', testData),

  // Update test
  update: (id, testData) =>
    apiClient.put(`/tests/${id}`, testData),

  // Delete test
  delete: (id) =>
    apiClient.delete(`/tests/${id}`),

  // Upload test file (CSV/PDF)
  uploadFile: (patientId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    return apiClient.upload('/tests/upload', formData, onProgress);
  },

  // Verify test data
  verify: (id) =>
    apiClient.post(`/tests/${id}/verify`),

  // Get pending tests (for doctor)
  getPending: () =>
    apiClient.get('/tests/pending'),

  // Get tests by status
  getByStatus: (status) =>
    apiClient.get('/tests', { params: { status } }),
};

// ============================================
// Prediction/ML API
// ============================================
export const predictionAPI = {
  // Run prediction for a test
  predict: (testId) =>
    apiClient.post(`/predictions/run`, { test_id: testId }),

  // Get prediction result
  getById: (id) =>
    apiClient.get(`/predictions/${id}`),

  // Get all predictions
  getAll: (params = {}) =>
    apiClient.get('/predictions', { params }),

  // Add doctor notes to prediction
  addNotes: (id, notes) =>
    apiClient.patch(`/predictions/${id}/notes`, { notes }),

  // Finalize prediction report
  finalize: (id, doctorAnalysis) =>
    apiClient.post(`/predictions/${id}/finalize`, { doctor_analysis: doctorAnalysis }),

  // Download prediction report as PDF
  downloadReport: (id) =>
    apiClient.download(`/predictions/${id}/report`, `prediction_report_${id}.pdf`),

  // Get prediction history with filters
  getHistory: (params = {}) =>
    apiClient.get('/predictions/history', { params }),
};

// ============================================
// DNA Recommendation API
// ============================================
export const dnaRecommendationAPI = {
  // Get DNA recommendation for a prediction
  getByPrediction: (predictionId) =>
    apiClient.get(`/predictions/${predictionId}/dna-recommendation`),

  // Override DNA recommendation (doctor only)
  override: (predictionId, recommendation, reason) =>
    apiClient.post(`/predictions/${predictionId}/dna-recommendation/override`, {
      recommendation,
      reason,
    }),
};

// ============================================
// Analytics API
// ============================================
export const analyticsAPI = {
  // Get dashboard overview stats
  getDashboardStats: () =>
    apiClient.get('/analytics/dashboard'),

  // Get prediction trends
  getPredictionTrends: (params = {}) =>
    apiClient.get('/analytics/predictions/trends', { params }),

  // Get risk distribution
  getRiskDistribution: (params = {}) =>
    apiClient.get('/analytics/risk-distribution', { params }),

  // Get age-wise distribution
  getAgeDistribution: () =>
    apiClient.get('/analytics/age-distribution'),

  // Get gender-wise distribution
  getGenderDistribution: () =>
    apiClient.get('/analytics/gender-distribution'),

  // Get CBC/HPLC parameter patterns
  getParameterPatterns: (params = {}) =>
    apiClient.get('/analytics/parameter-patterns', { params }),

  // Get monthly/weekly reports
  getReports: (type = 'monthly') =>
    apiClient.get('/analytics/reports', { params: { type } }),

  // Get model accuracy metrics
  getModelMetrics: () =>
    apiClient.get('/analytics/model-metrics'),
};

// ============================================
// Administrative API
// ============================================
export const adminAPI = {
  // User Management
  getUsers: (params = {}) =>
    apiClient.get('/admin/users', { params }),

  createUser: (userData) =>
    apiClient.post('/admin/users', userData),

  updateUser: (id, userData) =>
    apiClient.put(`/admin/users/${id}`, userData),

  deleteUser: (id) =>
    apiClient.delete(`/admin/users/${id}`),

  // System Management
  getAuditLogs: (params = {}) =>
    apiClient.get('/admin/logs', { params }),

  getConfig: () =>
    apiClient.get('/admin/config'),

  updateConfig: (configData) =>
    apiClient.put('/admin/config', configData),
};

// Export all APIs
export default {
  auth: authAPI,
  patient: patientAPI,
  test: testAPI,
  prediction: predictionAPI,
  dnaRecommendation: dnaRecommendationAPI,
  analytics: analyticsAPI,
  admin: adminAPI,
};
