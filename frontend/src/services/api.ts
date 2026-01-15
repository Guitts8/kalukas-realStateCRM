// frontend/src/services/api.ts
import axios from "axios";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("jwt");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

const base =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "") ||
  "http://localhost:3333";

export const api = axios.create({
  baseURL: base.endsWith("/api") ? base : `${base}/api`,
});

// ✅ Envia token em toda request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Se não autorizado, derruba a sessão e volta pro login
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status;

    if (typeof window !== "undefined" && (status === 401 || status === 403)) {
      clearSession();

      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }

    return Promise.reject(error);
  }
);
