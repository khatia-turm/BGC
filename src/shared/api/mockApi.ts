import seed from "../../../mock-be/mock-data.json";
import { createMockApi, MOCK_STATE_VERSION } from "../../../mock-be/api.js";
import { ApiError } from "./errors";
import { getAuthToken } from "@shared/auth/session";

export const MOCK_STORAGE_KEY = `meeplehub-mock-v${MOCK_STATE_VERSION}`;
let fallbackState: unknown;
let storageUnavailable = false;

export async function mockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  options.signal?.throwIfAborted();
  await new Promise((resolve) => setTimeout(resolve, 100));
  options.signal?.throwIfAborted();
  let state = fallbackState ?? seed;
  try {
    if (!storageUnavailable) {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      state = parsed?.mockStateVersion === MOCK_STATE_VERSION ? parsed : seed;
    }
  } catch {
    // Private browsing/storage restrictions still allow an in-memory session.
  }
  const api = createMockApi(state);
  const headers = new Headers(options.headers);
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const response = api.request(path, { method: options.method, headers, body: options.body });
  fallbackState = api.snapshot();
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fallbackState));
  } catch {
    // Retain the current session when local storage is unavailable or full.
    storageUnavailable = true;
  }
  if (response.status >= 400) {
    const problem = response.body as { detail: string; errors?: Record<string, string[]> };
    throw new ApiError(response.status, problem.detail, problem.errors);
  }
  return response.body as T;
}
