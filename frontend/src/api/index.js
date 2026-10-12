/**
 * ThalCare API Module
 * Central export for all API functionality
 */

export { default as api, apiClient, TokenService } from './client';
export {
  authAPI,
  patientAPI,
  testAPI,
  predictionAPI,
  dnaRecommendationAPI,
  analyticsAPI,
  adminAPI,
} from './endpoints';
export { default as endpoints } from './endpoints';
