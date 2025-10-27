// frontend/src/services/api.js
import axios from "axios";

// استخدم VITE_API_URL من Render وإلا محلياً 8000
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// أنشئ إنستانس واحد فقط
const instance = axios.create({
  baseURL,
  // withCredentials: true, // فعّلها فقط لو تعتمد على جلسات/كوكيز
});

// صدّر بنفس الاسم الذي يستخدمه الكود الحالي
export const api = instance;

// وصدّر كـ default أيضاً لو في ملفات تستورده بدون أقواس
export default instance;
