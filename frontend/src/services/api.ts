const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "smritivani.access_token";
const REFRESH_TOKEN_KEY = "smritivani.refresh_token";
const ELDER_ID_KEY = "smritivani.elder_id";
const PATIENT_DEVICE_READY_KEY = "smritivani.patient_device_ready";
const CAREGIVER_UI_UNLOCKED_KEY = "smritivani.caregiver_ui_unlocked";
const DEVICE_TOKEN_KEY = "smritivani.device_token";

export type AuthSession = { access_token?: string; refresh_token?: string; user?: Record<string, unknown> };
export type ElderProfileInput = {
  name: string; age?: number | null; language?: string; city?: string | null;
  timezone?: string; lives_alone?: boolean; doctor_name?: string | null; doctor_phone?: string | null;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.name = "ApiError"; this.status = status; }
}

export function saveSession(session: AuthSession) {
  if (session.access_token) localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  if (session.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
}
export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(CAREGIVER_UI_UNLOCKED_KEY);
}
export function getStoredToken() { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function getStoredRefreshToken() { return localStorage.getItem(REFRESH_TOKEN_KEY); }
export function saveCurrentElderId(id: string) { localStorage.setItem(ELDER_ID_KEY, id); }
export function getCurrentElderId() { return localStorage.getItem(ELDER_ID_KEY); }
export function getStoredDeviceToken() { return localStorage.getItem(DEVICE_TOKEN_KEY); }
export function saveDevicePairing(pairing: { device_token: string; elderly_profile: Record<string, unknown> }) {
  localStorage.setItem(DEVICE_TOKEN_KEY, pairing.device_token);
  if (typeof pairing.elderly_profile.id === "string") localStorage.setItem(ELDER_ID_KEY, pairing.elderly_profile.id);
  localStorage.setItem(PATIENT_DEVICE_READY_KEY, "true");
  sessionStorage.removeItem(CAREGIVER_UI_UNLOCKED_KEY);
}
export function isPatientDeviceReady() {
  // Return true if device token exists (patient is paired with a device)
  return Boolean(getStoredDeviceToken());
}
export function disablePatientDevice() {
  localStorage.removeItem(PATIENT_DEVICE_READY_KEY);
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  localStorage.removeItem(ELDER_ID_KEY);
}
export function unlockCaregiverInterface() { sessionStorage.setItem(CAREGIVER_UI_UNLOCKED_KEY, "true"); }
export function isCaregiverInterfaceUnlocked() { return sessionStorage.getItem(CAREGIVER_UI_UNLOCKED_KEY) === "true"; }

let inFlightRefresh: Promise<AuthSession | null> | null = null;

function refreshStoredSession(refreshToken: string): Promise<AuthSession | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return null;
        const session = await response.json() as AuthSession;
        if (!session.access_token) return null;
        saveSession(session);
        return session;
      } catch { return null; }
    })().finally(() => { inFlightRefresh = null; });
  }
  return inFlightRefresh;
}

async function request<T>(path: string, options: RequestInit = {}, redirectOnUnauthorized = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const deviceToken = getStoredDeviceToken();
  if (deviceToken) headers.set("X-Device-Token", deviceToken);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); }
  catch { throw new ApiError("Could not reach SmritiVani. Check that the backend is running.", 0); }
  if (response.status === 401 && redirectOnUnauthorized && path !== "/auth/refresh") {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      const session = await refreshStoredSession(refreshToken);
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
        try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); }
        catch { throw new ApiError("Could not reach SmritiVani. Check that the backend is running.", 0); }
      }
    }
  }
  if (response.status === 401 && redirectOnUnauthorized) {
    if (getStoredDeviceToken()) {
      localStorage.removeItem(DEVICE_TOKEN_KEY);
      localStorage.removeItem(PATIENT_DEVICE_READY_KEY);
      localStorage.removeItem(ELDER_ID_KEY);
      window.location.assign("/elderly/pair");
    } else if (isPatientDeviceReady()) {
      clearSession();
      window.location.assign("/patient-session-expired");
    } else {
      clearSession();
      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") window.location.assign("/login");
    }
  }
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const payload = await response.json();
      const detail = payload?.detail ?? payload?.message ?? payload?.error_description ?? payload?.msg;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(detail)) message = detail.map((item) => item.msg || JSON.stringify(item)).join(" ");
      else if (typeof payload?.msg === "string") message = payload.msg;
    } catch { /* retain status message when the response has no JSON body */ }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const signup = (data: { email: string; password: string; display_name: string; account_type: "caregiver" }) => request<AuthSession & { id?: string; email?: string; message?: string }>("/auth/signup", { method: "POST", body: JSON.stringify(data) });
export const login = (credentials: { email: string; password: string }) => request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const getCurrentUser = () => request<Record<string, unknown>>("/users/me", {}, false);
export const updateCurrentUser = (data: { phone?: string; city?: string; display_name?: string }) => request<Record<string, unknown>>("/users/me", { method: "PATCH", body: JSON.stringify(data) });
export const refresh = (refresh_token: string) => request<AuthSession>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }) }, false);
export const logout = () => request<void>("/auth/logout", { method: "POST" });
export const createElderlyProfile = (data: ElderProfileInput) => request<Record<string, unknown>>("/elders", { method: "POST", body: JSON.stringify(data) });
export const getElderlyProfiles = () => request<{ items: Record<string, unknown>[]; limit: number; offset: number }>("/elders");
export type ElderResource = "contacts" | "memories" | "events" | "medicines" | "medicine-logs" | "daily-logs" | "voice-notes" | "alerts" | "conversations" | "messages";
const resourcePath = (elderId: string, resource: ElderResource) => getStoredDeviceToken() ? `/pairing/resources/${resource}` : `/elders/${encodeURIComponent(elderId)}/${resource}`;
export const listElderResource = (elderId: string, resource: ElderResource) => request<{ items: Record<string, unknown>[]; limit: number; offset: number }>(resourcePath(elderId, resource));
export const createElderResource = (elderId: string, resource: ElderResource, data: Record<string, unknown>) => request<Record<string, unknown>>(resourcePath(elderId, resource), { method: "POST", body: JSON.stringify({ data }) });
export const updateElderResource = (elderId: string, resource: ElderResource, recordId: string, data: Record<string, unknown>) => request<Record<string, unknown>>(`${resourcePath(elderId, resource)}/${encodeURIComponent(recordId)}`, { method: "PATCH", body: JSON.stringify({ data }) });
export const deleteElderResource = (elderId: string, resource: ElderResource, recordId: string) => request<void>(`${resourcePath(elderId, resource)}/${encodeURIComponent(recordId)}`, { method: "DELETE" });
export const updateElderProfile = (elderId: string, data: Partial<ElderProfileInput>) => request<Record<string, unknown>>(`/elders/${encodeURIComponent(elderId)}`, { method: "PATCH", body: JSON.stringify(data) });
export const createClaimCode = (elderId: string) => request<{ elder_id: string; claim_code: string; expires_at: string; expires_in_seconds: number }>(`/elders/${encodeURIComponent(elderId)}/claim-code`, { method: "POST" });
export const revokeClaimCode = (elderId: string) => request<void>(`/elders/${encodeURIComponent(elderId)}/claim-code`, { method: "DELETE" });
export const claimElderProfile = (code: string) => request<{ elder_id: string; elder_name: string; linked_at: string }>("/users/me/elder-claim", { method: "POST", body: JSON.stringify({ code }) });
export const createDevicePairingCode = (elderId: string) => request<{ elder_id: string; claim_code: string; expires_at: string; expires_in_seconds: number }>(`/pairing/codes?elder_id=${encodeURIComponent(elderId)}`, { method: "POST" });
export const getCaregiverPairedDevices = (elderId: string) => request<{ items: Record<string, unknown>[] }>(`/pairing/devices?elder_id=${encodeURIComponent(elderId)}`);
export const revokeCaregiverPairedDevices = (elderId: string) => request<{ revoked_devices: number }>("/pairing/unpair", { method: "POST", body: JSON.stringify({ elder_id: elderId }) });
export type DevicePairing = { device_token: string; device_id: string; elderly_profile: Record<string, unknown> };
export const verifyDevicePairing = (claim_code: string) => request<DevicePairing>("/pairing/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim_code }) });
export const getPairedElderProfile = () => request<{ elderly_profile: Record<string, unknown> }>("/pairing/profile");
export const unpairCurrentDevice = () => request<void>("/pairing/device", { method: "DELETE" });
export const sendVoiceText = (text: string, language = "hi-IN") => request<Record<string, unknown>>("/voice/text", { method: "POST", body: JSON.stringify({ text, language }) });
export const sendVoice = (audioBlob: Blob) => request<Record<string, unknown>>("/voice/process", { method: "POST", headers: { "Content-Type": audioBlob.type || "application/octet-stream" }, body: audioBlob });
export const getVoiceHistory = (limit = 20) => request<{ items: Record<string, unknown>[] }>(`/voice/history?limit=${limit}`);
export const getCaregiverVoiceInteractions = (elderId: string, date?: string) => request<{ items: Record<string, unknown>[] }>(`/caregiver/elders/${encodeURIComponent(elderId)}/interactions${date ? `?date=${encodeURIComponent(date)}` : ""}`);
export const getCaregiverSafetyAlerts = (elderId: string, status?: string) => request<{ items: Record<string, unknown>[] }>(`/caregiver/elders/${encodeURIComponent(elderId)}/alerts${status ? `?status=${encodeURIComponent(status)}` : ""}`);
export const updateCaregiverSafetyAlert = (alertId: string, action: "acknowledge" | "resolve" | "false-positive") => request<Record<string, unknown>>(`/caregiver/alerts/${encodeURIComponent(alertId)}/${action}`, { method: "POST" });
export const getCaregiverDailySummary = (elderId: string, date: string) => request<Record<string, unknown>>(`/caregiver/elders/${encodeURIComponent(elderId)}/daily-summary?summary_date=${encodeURIComponent(date)}`);

export const elderlyAPI = {
  pairDevice: verifyDevicePairing,
  getElderlyProfile: getPairedElderProfile,
  sendVoice,
  sendText: sendVoiceText,
  checkEmergency: sendVoiceText,
};
