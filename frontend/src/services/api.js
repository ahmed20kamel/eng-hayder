// frontend/src/services/api.js
import axios from "axios";

// نظّف الـ URL من أي / في آخره
const ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/+$/,
  ""
);

// الواجهة الأساسية للـ API تنتهي بـ /api/
const instance = axios.create({
  baseURL: `${ROOT}/api/`,
  withCredentials: true, // لا تضر، وضرورية لو استخدمت جلسات مستقبلاً
});

// تصديرين ليتوافق مع كل الاستيرادات
export const api = instance;
export default instance;
