// @vitest-environment node
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createMockApi } from "./api.js";
import { createMockApp } from "./app.js";

const seed = JSON.parse(
  await readFile(new URL("./mock-data.json", import.meta.url), "utf8"),
);
const now = () => Date.parse("2026-10-17T12:00:00Z");
let server, baseUrl, api, persisted, persistFailure;
beforeEach(async () => {
  api = createMockApi(seed, { now });
  persisted = undefined;
  persistFailure = undefined;
  const app = createMockApp({
    api,
    persist: async (state) => {
      if (persistFailure) throw persistFailure;
      persisted = state;
    },
  });
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

it("serves the same responses and mutations as the browser engine", async () => {
  const expected = createMockApi(seed, { now });
  const send = async (path, method = "GET", body, token) => {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };
    const response = await fetch(`${baseUrl}${path}`, options);
    const actual = response.status === 204 ? undefined : await response.json();
    expect({ status: response.status, body: actual }).toEqual(
      expected.request(path, options),
    );
    return actual;
  };
  const { token } = await send("/api/auth/login", "POST", {
    email: "nika@example.com",
    password: "password",
  });
  for (const path of [
    "/api/boardgames?pageSize=2",
    "/api/boardgames/categories",
    "/api/clubs?page=2",
    "/api/clubs/456",
    "/api/clubs/456/boardgames",
    "/api/tournaments",
    "/api/tournaments/700",
    "/api/auth/me",
    "/api/clubs/my",
    "/api/clubs/456/my",
    "/api/users/234",
    "/api/users/234/clubs",
    "/api/users/search?q=an",
    "/api/tournaments/my-registrations",
    "/api/clubs/456/tournaments",
    "/api/tournaments/700/registrations",
    "/api/unknown",
  ])
    await send(path, "GET", undefined, token);
  const club = await send("/api/clubs/456");
  await send(
    "/api/clubs/456",
    "PUT",
    { ...club, description: "Saved over HTTP" },
    token,
  );
  await send("/api/clubs/456/boardgames/13", "DELETE", undefined, token);
  await send("/api/clubs/456/boardgames", "POST", { BggGameId: 167791 }, token);
  await send(
    "/api/tournaments/700/registrations/me",
    "DELETE",
    undefined,
    token,
  );
  await send("/api/tournaments/700/registrations", "POST", undefined, token);
  await send("/api/tournaments/700", "GET", undefined, token);
  expect(persisted.clubs.find((item) => item.id === 456).description).toBe(
    "Saved over HTTP",
  );
  const restarted = createMockApi(persisted, { now });
  expect(restarted.request("/api/clubs/456")).toEqual(
    api.request("/api/clubs/456"),
  );
});

it("allows local frontend origins and PUT preflights and returns JSON errors", async () => {
  const preflight = await fetch(`${baseUrl}/api/clubs/456`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5174",
      "Access-Control-Request-Method": "PUT",
    },
  });
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://localhost:5174",
  );
  expect(preflight.headers.get("Access-Control-Allow-Methods")).toContain(
    "PUT",
  );
  const malformed = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: "{",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://127.0.0.1:5173",
    },
  });
  expect(malformed.status).toBe(400);
  expect(malformed.headers.get("Content-Type")).toContain(
    "application/problem+json",
  );
  expect(malformed.headers.get("Access-Control-Allow-Origin")).toBe(
    "http://127.0.0.1:5173",
  );
  expect(await malformed.json()).toMatchObject({
    status: 400,
    detail: "Invalid JSON request body.",
  });
});

it("rolls back writes when persistence fails and accepts later requests", async () => {
  const {
    body: { token },
  } = api.request("/api/auth/login", {
    method: "POST",
    body: { email: "nika@example.com", password: "password" },
  });
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const initial = api.request("/api/users/234", { headers }).body;
  persistFailure = new Error("Storage unavailable");
  const failed = await fetch(`${baseUrl}/api/users/234`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ firstName: "Unsaved" }),
  });
  expect(failed.status).toBe(500);
  expect(api.request("/api/users/234", { headers }).body).toEqual(initial);
  persistFailure = undefined;
  const saved = await fetch(`${baseUrl}/api/users/234`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ firstName: "Saved" }),
  });
  expect(saved.status).toBe(200);
  expect(persisted.users.find((item) => item.id === 234).firstName).toBe(
    "Saved",
  );
});

it("accepts avatar payloads supported by the UI and persists parallel writes", async () => {
  const {
    body: { token },
  } = api.request("/api/auth/login", {
    method: "POST",
    body: { email: "nika@example.com", password: "password" },
  });
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const avatarUrl = `data:image/png;base64,${"A".repeat(600_000)}`;
  const requests = [
    fetch(`${baseUrl}/api/users/234`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ avatarUrl }),
    }),
    fetch(`${baseUrl}/api/users/234`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ firstName: "Changed" }),
    }),
  ];
  const responses = await Promise.all(requests);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  const account = persisted.users.find((item) => item.id === 234);
  expect(account.avatarUrl).toBe(avatarUrl);
  expect(account.firstName).toBe("Changed");
});
