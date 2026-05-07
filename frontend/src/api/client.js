import axios from 'axios';
import { isDemoMode, DEMO_TENDERS, DEMO_BIDDERS, DEMO_VERDICTS, DEMO_STATS, DEMO_REVIEW_QUEUE, DEMO_AUDIT_LOGS } from './demoData';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper: wrap data like axios response
const wrap = (data) => Promise.resolve({ data });

// Helper: try real API first, fall back to demo
const tryApi = (apiCall, fallback) => {
  if (isDemoMode()) return fallback();
  return apiCall().catch(() => fallback());
};

// Dashboard
export const getDashboardStats = () => tryApi(
  () => api.get('/dashboard/stats'),
  () => wrap(DEMO_STATS)
);

// Tenders
export const getTenders = (params) => tryApi(
  () => api.get('/tenders', { params }),
  () => wrap(DEMO_TENDERS)
);
export const getTender = (id) => tryApi(
  () => api.get(`/tenders/${id}`),
  () => wrap(DEMO_TENDERS.find(t => t.id === Number(id)) || DEMO_TENDERS[0])
);
export const createTender = (data) => api.post('/tenders', data);
export const uploadTenderDocument = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/tenders/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const extractCriteria = (id) => api.post(`/tenders/${id}/extract-criteria`);
export const evaluateTender = (id) => api.post(`/tenders/${id}/evaluate`);

// Bidders
export const getBidders = (tenderId) => tryApi(
  () => api.get(`/tenders/${tenderId}/bidders`),
  () => wrap(DEMO_BIDDERS[tenderId] || [])
);
export const getBidder = (id) => api.get(`/bidders/${id}`);
export const createBidder = (tenderId, d) => api.post(`/tenders/${tenderId}/bidders`, d);
export const uploadBidderDocument = (bidderId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/bidders/${bidderId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const awardBidder = (id) => api.post(`/bidders/${id}/award`);

// Verdicts
export const getTenderVerdicts = (id) => tryApi(
  () => api.get(`/tenders/${id}/verdicts`),
  () => wrap(DEMO_VERDICTS[id] || [])
);
export const getBidderVerdicts = (id) => api.get(`/bidders/${id}/verdicts`);
export const reviewVerdict = (id, d) => api.post(`/verdicts/${id}/review`, d);

// Review Queue
export const getReviewQueue = () => tryApi(
  () => api.get('/review-queue'),
  () => wrap(DEMO_REVIEW_QUEUE)
);
export const submitReview = (id, d) => api.post(`/verdicts/${id}/review`, d);

// Audit
export const getAuditLogs = (params) => tryApi(
  () => api.get('/audit-log', { params }),
  () => wrap(DEMO_AUDIT_LOGS)
);
export const getAuditLog = (params) => tryApi(
  () => api.get('/audit-log', { params }),
  () => wrap(DEMO_AUDIT_LOGS)
);

export default api;
