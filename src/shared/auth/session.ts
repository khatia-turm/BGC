const TOKEN_KEY = "authToken";
const EXPIRY_KEY = "authTokenExpiresAt";
const AUTH_CHANGE_EVENT = "auth-session-change";

export function setAuthSession(token: string, expiresAt?: string, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(EXPIRY_KEY);
  storage.setItem(TOKEN_KEY, token);
  const expiry = expiresAt ?? readJwtExpiry(token);
  if (expiry) storage.setItem(EXPIRY_KEY, expiry);
  else storage.removeItem(EXPIRY_KEY);
  notifyAuthChange();
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  notifyAuthChange();
}

export function getAuthToken() {
  const storage = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
  const token = storage.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiresAt = storage.getItem(EXPIRY_KEY);
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    clearAuthSession();
    return null;
  }

  return token;
}

export const isAuthenticated = () => Boolean(getAuthToken());

export function subscribeToAuthSession(onChange: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function readJwtExpiry(token: string) {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return undefined;
    const payload = JSON.parse(
      atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;
  } catch {
    return undefined;
  }
}
