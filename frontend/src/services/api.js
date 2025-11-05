// frontend/src/services/api.js
import axios from "axios";

// ✅ رابط الباك إند الثابت على Render
const ROOT = "https://eng-hayder.onrender.com";

const api = axios.create({
  baseURL: `${ROOT}/api/`,
  withCredentials: true,
});

// ✅ قراءة CSRF من الكوكي
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

let csrfReady = false;

// ✅ تأكيد وجود الـ CSRF قبل أي POST / PUT / PATCH / DELETE
async function ensureCsrf() {
  if (csrfReady && getCookie("csrftoken")) return;
  try {
    await axios.get(`${ROOT}/api/csrf/`, {
      withCredentials: true,
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    csrfReady = true;
  } catch {}
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();
  if (
    ["post", "put", "patch", "delete"].includes(method) &&
    !getCookie("csrftoken")
  ) {
    await ensureCsrf();
  }
  const csrftoken = getCookie("csrftoken") || getCookie("CSRF-TOKEN");
  if (csrftoken) {
    config.headers["X-CSRFToken"] = csrftoken;
    config.headers["X-CSRF-Token"] = csrftoken;
  }
  return config;
});

// ✅ إظهار الأخطاء في الـ Console بشكل مرتب
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.groupCollapsed(
      `[API ERROR] ${status ?? "?"} ${err.config?.method?.toUpperCase()} ${
        err.config?.url
      }`
    );
    console.log("Request:", err.config);
    console.log("Response:", data);
    console.groupEnd();
    return Promise.reject(err);
  }
);

export { api };
export default api;
