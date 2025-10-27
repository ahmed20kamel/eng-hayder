// frontend/src/services/api.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  // withCredentials: true, // فعّلها فقط لو تستخدم جلسات/كوكيز
});

// مثال دوال جاهزة (اختياري)
export const getProject = (id) => api.get(`/api/projects/${id}/`);
export const createProject = (payload) => api.post(`/api/projects/`, payload);

export default api;
