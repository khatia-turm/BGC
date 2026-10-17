import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setAuthSession, clearAuthSession } from "@shared/auth/session";
import type { RegisterResponse } from "@features/auth/register/api";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "mock");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("keeps session mutations when browser storage fills up", async () => {
  const { mockRequest } = await import("./mockApi");
  const { token } = await mockRequest<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "nika@example.com", password: "password" }) });
  setAuthSession(token);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
  await mockRequest("/api/users/234", { method: "PATCH", body: JSON.stringify({ firstName: "Saved in memory" }) });
  await mockRequest("/api/users/234", { method: "PATCH", body: JSON.stringify({ lastName: "Also saved" }) });
  expect(await mockRequest("/api/users/234")).toMatchObject({ firstName: "Saved in memory", lastName: "Also saved" });
});

it("uses normal entity clients for login, registration and reloading a saved account", async () => {
  const { apiClient } = await import("./client");
  const response = await apiClient<RegisterResponse>("/api/users", { method: "POST", body: JSON.stringify({ firstName: "Browser", lastName: "Player", nickname: "browser-player", email: "browser@example.com", phone: "+995599000002", birthday: "2000-01-01", gender: 1, password: "BrowserPass1!" }) });
  setAuthSession(response.token);
  const users = await import("@entities/user/api");
  expect(await users.getCurrentUser()).toMatchObject({ id: response.userId, nickname: "browser-player", clubs: [] });
  await users.updateUser(response.userId, { firstName: "Saved" });
  vi.resetModules();
  const reloaded = await import("@entities/user/api");
  expect(await reloaded.getUser(response.userId)).toMatchObject({ firstName: "Saved" });
  clearAuthSession();
  await expect(reloaded.getCurrentUser()).rejects.toMatchObject({ status: 401 });
});

it("switches accounts without retaining another user's clubs or permissions", async () => {
  const { apiClient } = await import("./client");
  const first = await apiClient<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "nika@example.com", password: "password" }) });
  setAuthSession(first.token);
  expect(await apiClient("/api/auth/me")).toMatchObject({ id: 234, clubs: expect.arrayContaining([expect.objectContaining({ id: 456 })]) });
  const second = await apiClient<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "ana@example.com", password: "password" }) });
  setAuthSession(second.token);
  expect(await apiClient("/api/auth/me")).toMatchObject({ id: 235, clubs: [] });
  await expect(apiClient("/api/clubs/456/my")).rejects.toMatchObject({ status: 404 });
  const anonymousHeaders = new Headers({ Authorization: "Bearer invalid" });
  await expect(apiClient("/api/auth/me", { headers: anonymousHeaders })).rejects.toMatchObject({ status: 401 });
});

it("supports catalog and club DTO adapters and request cancellation", async () => {
  const { getGamesPage } = await import("@entities/game/api");
  const { getClubsPage, getClubGames } = await import("@entities/club/api");
  expect((await getGamesPage({ search: "mars", pageSize: 1 })).items[0]).toMatchObject({ id: 13, title: "Terraforming Mars" });
  expect((await getClubsPage({ pageSize: 1 })).items[0].id).toBeGreaterThan(0);
  expect((await getClubGames(456)).some((game) => game.id === 13)).toBe(true);
  const { mockRequest } = await import("./mockApi");
  const controller = new AbortController();
  controller.abort();
  await expect(mockRequest("/api/boardgames", { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
});
