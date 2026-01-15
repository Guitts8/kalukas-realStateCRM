// frontend/src/services/auth.ts
export const AUTH_TOKEN_KEY = "crm_token";
export const AUTH_ROLE_KEY = "crm_role";
export const AUTH_USER_KEY = "crm_user";

// chaves antigas (compatibilidade)
const LEGACY_TOKEN_KEYS = ["token", "accessToken", "authToken", "jwt"];

export function getToken(): string {
  if (typeof window === "undefined") return "";

  const primary = localStorage.getItem(AUTH_TOKEN_KEY);
  if (primary && primary.trim()) return primary.trim();

  // compat: se ainda existir token em chaves antigas
  for (const k of LEGACY_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  return "";
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  const t = (token ?? "").trim();
  if (!t) return;

  // chave nova
  localStorage.setItem(AUTH_TOKEN_KEY, t);

  // compat: mantém as antigas também para não quebrar telas antigas
  for (const k of LEGACY_TOKEN_KEYS) localStorage.setItem(k, t);
}

export function setRole(role: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_ROLE_KEY, String(role ?? ""));
}

export function getRole(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AUTH_ROLE_KEY) ?? "";
}

export function setUser(user: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user ?? {}));
}

export function getUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  // limpa antigas também
  for (const k of LEGACY_TOKEN_KEYS) localStorage.removeItem(k);
}

export function isAuthed(): boolean {
  return !!getToken()?.trim();
}

/** ====== JWT decode (role dentro do token) ====== */
function base64UrlDecode(input: string) {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

function extractRoleFromPayload(payload: any): any {
  if (!payload) return null;

  return (
    payload.role ??
    payload.perfil ??
    payload.profile ??
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    payload.roles ??
    payload["roles"]
  );
}

export function isAdmin(): boolean {
  // 1) role salvo
  const stored = (getRole() || "").toLowerCase();
  if (stored.includes("admin")) return true;

  // 2) role salvo no user
  const user = getUser<any>();
  const ur = extractRoleFromPayload(user);
  if (ur) {
    if (Array.isArray(ur)) return ur.some((x) => String(x).toLowerCase().includes("admin"));
    if (String(ur).toLowerCase().includes("admin")) return true;
  }

  // 3) role dentro do JWT (isso resolve o loop quando o backend não devolve role no response)
  const token = getToken();
  const payload = decodeJwtPayload(token);
  const tr = extractRoleFromPayload(payload);
  if (!tr) return false;

  if (Array.isArray(tr)) return tr.some((x) => String(x).toLowerCase().includes("admin"));
  return String(tr).toLowerCase().includes("admin");
}

export function buildLoginUrl(nextPath: string) {
  const safe = nextPath?.trim() ? nextPath : "/imoveis";
  return `/login?next=${encodeURIComponent(safe)}`;
}
