import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthSession,
  getAuthRoles,
  getAuthToken,
  getAuthUserId,
  hasAuthRole,
  setAuthSession,
  subscribeToAuthSession,
} from "./session";

const createToken = (payload: Record<string, unknown>) => {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${encodedPayload}.signature`;
};

describe("auth session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores remembered sessions in local storage and clears session storage", () => {
    sessionStorage.setItem("authToken", "old-token");
    setAuthSession("new-token", "2999-01-01T00:00:00.000Z", true);

    expect(localStorage.getItem("authToken")).toBe("new-token");
    expect(sessionStorage.getItem("authToken")).toBeNull();
    expect(getAuthToken()).toBe("new-token");
  });

  it("expires sessions when the expiry date has passed", () => {
    setAuthSession("expired-token", "2000-01-01T00:00:00.000Z");

    expect(getAuthToken()).toBeNull();
    expect(sessionStorage.getItem("authToken")).toBeNull();
  });

  it("reads user ids and roles from jwt payload claims", () => {
    const token = createToken({
      UserId: "42",
      role: "Player",
      roles: ["ClubAdmin"],
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
        "AppAdmin",
    });

    setAuthSession(token, "2999-01-01T00:00:00.000Z");

    expect(getAuthUserId()).toBe(42);
    expect(getAuthRoles()).toEqual(["Player", "ClubAdmin", "AppAdmin"]);
    expect(hasAuthRole("ClubAdmin")).toBe(true);
    expect(hasAuthRole("Guest")).toBe(false);
  });

  it("notifies subscribers on auth changes and supports unsubscribe", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToAuthSession(onChange);

    setAuthSession("token", "2999-01-01T00:00:00.000Z");
    clearAuthSession();
    unsubscribe();
    setAuthSession("another-token", "2999-01-01T00:00:00.000Z");

    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
