import { mockRequest } from "./mockApi";
import { ApiError } from "./errors";
import { getAuthToken } from "@shared/auth/session";

export { ApiError, getApiFieldError } from "./errors";

const API_URL = (import.meta.env.VITE_API_URL ?? "mock").replace(/\/$/, "");
const USE_MOCK_API = API_URL === "mock";

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (USE_MOCK_API) return mockRequest<T>(path, options);

  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) throw await readError(response);

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as
      | string
      | {
          message?: string;
          detail?: string;
          errors?: Record<string, string[]>;
        };
    if (typeof body === "string") return new ApiError(response.status, body);
    const fieldMessage = Object.values(body.errors ?? {}).flat().join(" ");
    const message =
      body.detail ||
      body.message ||
      fieldMessage ||
      `Request failed with status ${response.status}`;
    return new ApiError(response.status, message, body.errors);
  } catch {
    return new ApiError(
      response.status,
      `Request failed with status ${response.status}`,
    );
  }
}
