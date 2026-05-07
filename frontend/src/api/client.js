import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Dashboard
export const getDashboardStats = ()       => api.get('/dashboard/stats');

// Tenders
export const getTenders  = (params)       => api.get('/tenders', { params });
export const getTender   = (id)           => api.get(`/tenders/${id}`);
export const createTender = (data)        => api.post('/tenders', data);
export const uploadTenderDocument = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/tenders/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const extractCriteria = (id)       => api.post(`/tenders/${id}/extract-criteria`);
export const evaluateTender  = (id)       => api.post(`/tenders/${id}/evaluate`);

// Bidders
export const getBidders  = (tenderId)     => api.get(`/tenders/${tenderId}/bidders`);
export const getBidder   = (id)           => api.get(`/bidders/${id}`);
export const createBidder = (tenderId, d) => api.post(`/tenders/${tenderId}/bidders`, d);
export const uploadBidderDocument = (bidderId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/bidders/${bidderId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const awardBidder = (id)           => api.post(`/bidders/${id}/award`);

// Verdicts
export const getTenderVerdicts = (id)     => api.get(`/tenders/${id}/verdicts`);
export const getBidderVerdicts = (id)     => api.get(`/bidders/${id}/verdicts`);
export const reviewVerdict     = (id, d)  => api.post(`/verdicts/${id}/review`, d);

// Review Queue — alias submitReview
export const getReviewQueue = ()          => api.get('/review-queue');
export const submitReview   = (id, d)     => api.post(`/verdicts/${id}/review`, d);

// Audit
export const getAuditLogs   = (params)    => api.get('/audit-log', { params });
export const getAuditLog    = (params)    => api.get('/audit-log', { params });
export const seedDemoData   = ()          => api.post('/seed');

export default api;
