import { mockRequest } from "./mockApi";
import { ApiError } from "./errors";

export { ApiError } from "./errors";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (USE_MOCK_API) {
    return mockRequest<T>(path, options);
  }

  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
