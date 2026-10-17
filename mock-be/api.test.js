// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockApi } from "./api.js";

const seed = JSON.parse(
  await readFile(new URL("./mock-data.json", import.meta.url), "utf8"),
);
const START = Date.parse("2026-10-17T12:00:00Z");
let clock, api;
const call = (path, method = "GET", body, token) =>
  api.request(path, {
    method,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
function login(email = "nika@example.com", password = "password") {
  const response = call("/api/auth/login", "POST", { email, password });
  expect(response.status, JSON.stringify(response.body)).toBe(200);
  return response.body.token;
}
const payload = () => ({
  clubId: 456,
  name: "Test tournament",
  description: "A tournament with real API rules.",
  tournamentType: 2,
  location: "Tbilisi",
  minParticipants: 1,
  maxParticipants: 1,
  boardGameIds: [13, 15],
  entryFee: 10,
  registrationOpensAt: new Date(clock + 1000).toISOString(),
  registrationClosesAt: new Date(clock + 60_000).toISOString(),
  cancellationDeadline: new Date(clock + 120_000).toISOString(),
  startsAt: new Date(clock + 180_000).toISOString(),
  endsAt: new Date(clock + 240_000).toISOString(),
});
function createOpenTournament() {
  const token = login();
  const response = call("/api/tournaments", "POST", payload(), token);
  expect(response.status, JSON.stringify(response.body)).toBe(201);
  const id = response.body.id;
  expect(
    call(`/api/tournaments/${id}/publish`, "POST", undefined, token).status,
  ).toBe(204);
  clock += 2000;
  return id;
}
beforeEach(() => {
  clock = START;
  api = createMockApi(seed, { now: () => clock });
});

describe("authentication and users", () => {
  it("uses each request's identity, derives roles, rejects expired tokens, and never exposes credentials", () => {
    expect(call("/api/auth/me").status).toBe(401);
    const admin = login();
    const player = login("ana@example.com");
    expect(
      JSON.parse(Buffer.from(admin.split(".")[1], "base64url")).role,
    ).toEqual(["ClubAdmin"]);
    expect(call("/api/auth/me", "GET", undefined, admin).body).toMatchObject({
      id: 234,
      clubs: [
        expect.objectContaining({ id: 456 }),
        expect.objectContaining({ id: 462 }),
      ],
    });
    expect(call("/api/auth/me", "GET", undefined, player).body).toMatchObject({
      id: 235,
      clubs: [],
    });
    const other = call("/api/users/234", "GET", undefined, player).body;
    expect(Object.keys(other).sort()).toEqual([
      "avatarUrl",
      "email",
      "firstName",
      "id",
      "lastName",
      "nickname",
    ]);
    expect(call("/api/users", "GET", undefined, player).status).toBe(403);
    expect(call("/api/users/234/clubs", "GET", undefined, player).status).toBe(
      403,
    );
    clock += 3600_000;
    expect(call("/api/auth/me", "GET", undefined, admin).status).toBe(401);
  });

  it("registers, validates duplicates, persists profile/password changes, and deactivates accounts", () => {
    const account = {
      firstName: "Test",
      lastName: "Player",
      nickname: "ტესტი",
      email: "new@example.com",
      phone: "+995599000001",
      birthday: "2000-01-01",
      gender: 2,
      password: "TestPass1!",
    };
    const invalid = call("/api/users", "POST", {
      ...account,
      email: "new@example.com",
      gender: null,
      password: "weak",
    });
    expect(invalid).toMatchObject({
      status: 400,
      body: {
        errors: { gender: expect.any(Array), password: expect.any(Array) },
      },
    });
    account.email = "new@example.com";
    const registered = call("/api/users", "POST", account);
    expect(registered.status).toBe(201);
    const { token, userId } = registered.body;
    expect(call("/api/auth/me", "GET", undefined, token).body.id).toBe(userId);
    expect(call("/api/users", "POST", account).status).toBe(409);
    expect(
      call(
        `/api/users/${userId}`,
        "PATCH",
        { firstName: "Updated", roles: ["AppAdmin"], status: "Deleted", id: 1 },
        token,
      ).body,
    ).toMatchObject({ id: userId, firstName: "Updated", status: "Active" });
    expect(
      call(
        "/api/auth/password",
        "POST",
        { currentPassword: "wrong", newPassword: "NewPassword1!" },
        token,
      ).status,
    ).toBe(400);
    expect(
      call(
        "/api/auth/password",
        "POST",
        { currentPassword: account.password, newPassword: "NewPassword1!" },
        token,
      ).status,
    ).toBe(204);
    api = createMockApi(api.snapshot(), { now: () => clock });
    expect(
      call("/api/auth/login", "POST", {
        email: account.email,
        password: account.password,
      }).status,
    ).toBe(401);
    const nextToken = login(account.email, "NewPassword1!");
    expect(
      call(`/api/users/${userId}`, "GET", undefined, nextToken).body.firstName,
    ).toBe("Updated");
    expect(call("/api/users/me", "DELETE", undefined, nextToken).status).toBe(
      204,
    );
    expect(
      call("/api/auth/login", "POST", {
        email: account.email,
        password: "NewPassword1!",
      }).status,
    ).toBe(403);
  });

  it("changes user statuses only as AppAdmin and enforces active-user rules", () => {
    const admin = login("admin@example.com");
    const player = login("ana@example.com");
    expect(
      call("/api/users/235/status", "PATCH", { status: "Suspended" }, player)
        .status,
    ).toBe(403);
    expect(
      call("/api/users/235/status", "PATCH", { status: "Suspended" }, admin)
        .body.status,
    ).toBe("Suspended");
    expect(call("/api/auth/me", "GET", undefined, player).status).toBe(403);
    expect(
      call("/api/users/235/status", "PATCH", { status: "Active" }, admin)
        .status,
    ).toBe(200);
    expect(
      call("/api/users/search?q=an", "GET", undefined, player).body.some(
        (item) => item.id === 235,
      ),
    ).toBe(true);
    expect(call("/api/users/search?q=a", "GET", undefined, player).status).toBe(
      400,
    );
    expect(
      call(
        "/api/users?status=Active&page=0&pageSize=101",
        "GET",
        undefined,
        admin,
      ).body,
    ).toMatchObject({ page: 1, pageSize: 100 });
  });

  it("implements expiring, single-use reset tokens without disclosing account existence", () => {
    const known = call("/api/auth/forgot-password", "POST", {
      email: "ana@example.com",
    });
    expect(
      call("/api/auth/forgot-password", "POST", {
        email: "unknown@example.com",
      }),
    ).toEqual(known);
    const reset = api.snapshot().passwordResetTokens[0];
    const body = {
      tokenFromEmail: reset.token,
      newPassword: "ResetPassword1!",
    };
    expect(call("/api/auth/reset-password", "POST", body).status).toBe(204);
    expect(call("/api/auth/reset-password", "POST", body).status).toBe(400);
    login("ana@example.com", body.newPassword);
    call("/api/auth/forgot-password", "POST", { email: "ana@example.com" });
    const expired = api.snapshot().passwordResetTokens[0];
    clock += 15 * 60_000;
    expect(
      call("/api/auth/reset-password", "POST", {
        ...body,
        tokenFromEmail: expired.token,
      }).status,
    ).toBe(400);
  });
});

describe("catalog and club workflows", () => {
  it("returns backend DTOs and validates pagination, search, filters and sorting", () => {
    const result = call(
      "/api/boardgames?search=mars&players=3&categoryId=9&pageSize=1",
    );
    expect(result.body).toMatchObject({
      page: 1,
      pageSize: 1,
      totalCount: 1,
      totalPages: 1,
      items: [
        expect.objectContaining({
          boardGameId: 13,
          title: "Terraforming Mars",
          categories: expect.any(Array),
        }),
      ],
    });
    expect(result.body.items[0]).not.toHaveProperty("id");
    expect(result.body.items[0]).not.toHaveProperty("bggId");
    expect(call("/api/boardgames/13").body).toEqual(result.body.items[0]);
    expect(
      call("/api/boardgames?sortBy=title&sortDirection=desc").body.items.map(
        (item) => item.title,
      ),
    ).toEqual(
      [...seed.games]
        .sort((a, b) => b.title.localeCompare(a.title))
        .map((item) => item.title),
    );
    for (const query of [
      "page=0",
      "pageSize=101",
      "page=oops",
      "players=0",
      "sortBy=invalid",
      "categoryId=-1",
    ])
      expect(call(`/api/boardgames?${query}`).status).toBe(400);
    expect(call("/api/boardgames?search=nonexistent").body).toMatchObject({
      items: [],
      totalPages: 0,
    });
    expect(
      call("/api/clubs").body.items.every((club) => club.status === "Active"),
    ).toBe(true);
    expect(call("/api/clubs?status=Active").status).toBe(401);
    expect(call("/api/clubs/461").status).toBe(404);
  });

  it("persists club requests and memberships through approval and inventory changes", () => {
    const applicant = login("ana@example.com");
    const admin = login("admin@example.com");
    const details = {
      name: "New club",
      city: "Tbilisi",
      address: "Test street",
      email: "club@example.com",
      description: "New club description",
    };
    const response = call("/api/clubs", "POST", details, applicant);
    expect(response.status).toBe(201);
    const id = response.body.clubId;
    expect(response.body).toMatchObject({
      name: details.name,
      status: "Pending",
      clubAdminId: 235,
    });
    expect(
      call("/api/clubs/my", "GET", undefined, applicant).body.items,
    ).toContainEqual(
      expect.objectContaining({ clubId: id, status: "Pending", role: "Admin" }),
    );
    expect(
      call(`/api/clubs/${id}/my`, "GET", undefined, applicant).body.name,
    ).toBe(details.name);
    expect(
      call(
        "/api/clubs?status=Pending",
        "GET",
        undefined,
        admin,
      ).body.items.some((club) => club.clubId === id),
    ).toBe(true);
    expect(
      call(
        `/api/clubs/${id}/boardgames`,
        "POST",
        { BggGameId: 167791 },
        applicant,
      ).status,
    ).toBe(403);
    expect(
      call(`/api/clubs/${id}/status`, "PATCH", { status: "Active" }, applicant)
        .status,
    ).toBe(403);
    expect(
      call(`/api/clubs/${id}/status`, "PATCH", { status: "Active" }, admin)
        .body,
    ).toMatchObject({ previousStatus: "Pending", status: "Active" });
    expect(
      call(
        `/api/clubs/${id}`,
        "PUT",
        { ...details, name: "Renamed" },
        applicant,
      ).body.name,
    ).toBe("Renamed");
    expect(
      call(
        `/api/clubs/${id}/boardgames`,
        "POST",
        { BggGameId: 167791 },
        applicant,
      ).body,
    ).toMatchObject({ clubId: id, boardGameId: 13, bggId: 167791 });
    expect(
      call(
        `/api/clubs/${id}/boardgames`,
        "POST",
        { BggGameId: 167791 },
        applicant,
      ).status,
    ).toBe(409);
    expect(call(`/api/clubs/${id}/boardgames`).body.items).toHaveLength(1);
    expect(
      call(`/api/clubs/${id}/boardgames/13`, "DELETE", undefined, applicant)
        .status,
    ).toBe(204);
    expect(call(`/api/clubs/${id}/boardgames`).body.items).toHaveLength(0);
    expect(
      call(
        `/api/clubs/${id}/boardgames`,
        "POST",
        { bggGameId: 167791 },
        applicant,
      ).status,
    ).toBe(200);
    expect(
      call(`/api/clubs/${id}/status`, "PATCH", { status: "Pending" }, admin)
        .status,
    ).toBe(400);
    api = createMockApi(api.snapshot(), { now: () => clock });
    expect(call(`/api/clubs/${id}`).body.name).toBe("Renamed");
    expect(call(`/api/clubs/${id}/boardgames`).body.items).toHaveLength(1);
  });

  it("limits BGG operations to their roles and reports actual offline import counts", () => {
    const admin = login("admin@example.com");
    const clubAdmin = login();
    const player = login("ana@example.com");
    expect(
      call("/api/boardgames/bgg-search", "POST", { Keyword: "mars" }, player)
        .status,
    ).toBe(403);
    expect(
      call("/api/boardgames/bgg-search", "POST", { Keyword: "mars" }, clubAdmin)
        .body,
    ).toEqual([{ bggId: 167791, title: "Terraforming Mars", year: 2016 }]);
    const bgg = call(
      "/api/boardgames/bgg-search?bggid=167791",
      "GET",
      undefined,
      clubAdmin,
    ).body;
    expect(bgg).toMatchObject({
      bggId: 167791,
      categories: expect.arrayContaining([expect.any(String)]),
    });
    expect(bgg).not.toHaveProperty("boardGameId");
    expect(
      call("/api/boardgames/import/hot", "POST", undefined, clubAdmin).status,
    ).toBe(403);
    expect(
      call("/api/boardgames/import/hot", "POST", undefined, admin).body,
    ).toEqual({
      requestedCount: 4,
      processedCount: 4,
      insertedCount: 0,
      updatedCount: 4,
    });
    expect(
      call(
        "/api/boardgames/seed-from-csv?offset=1&count=2",
        "POST",
        undefined,
        admin,
      ).body.processedCount,
    ).toBe(2);
    expect(
      call("/api/boardgames/seed-from-csv?offset=100", "POST", undefined, admin)
        .status,
    ).toBe(400);
  });
});

describe("tournament lifecycle and capacity", () => {
  it("creates and edits drafts, hides private events, and restricts edits after publication", () => {
    const admin = login();
    const player = login("ana@example.com");
    const input = payload();
    expect(call("/api/tournaments", "POST", input, player).status).toBe(403);
    expect(
      call("/api/tournaments", "POST", { ...input, boardGameIds: [14] }, admin)
        .status,
    ).toBe(400);
    expect(
      call(
        "/api/tournaments",
        "POST",
        { ...input, cancellationDeadline: input.startsAt },
        admin,
      ).status,
    ).toBe(400);
    const response = call("/api/tournaments", "POST", input, admin);
    expect(response.status).toBe(201);
    const id = response.body.id;
    expect(response.body).toMatchObject({
      status: 0,
      tournamentType: 2,
      boardGames: [
        expect.objectContaining({ boardGameId: 13 }),
        expect.objectContaining({ boardGameId: 15 }),
      ],
    });
    expect(call(`/api/tournaments/${id}`).status).toBe(404);
    expect(
      call("/api/tournaments").body.items.some((item) => item.id === id),
    ).toBe(false);
    expect(
      call(
        "/api/clubs/456/tournaments?status=Draft",
        "GET",
        undefined,
        admin,
      ).body.items.some((item) => item.id === id),
    ).toBe(true);
    expect(
      call(`/api/tournaments/${id}`, "PUT", { ...input, name: "Edited" }, admin)
        .status,
    ).toBe(204);
    expect(
      call(`/api/tournaments/${id}/publish`, "POST", undefined, admin).status,
    ).toBe(204);
    expect(call(`/api/tournaments/${id}`).body).toMatchObject({
      status: 1,
      name: "Edited",
      currentParticipants: 0,
      myRegistration: null,
    });
    expect(
      call(
        `/api/tournaments/${id}`,
        "PUT",
        { ...input, maxParticipants: 4 },
        admin,
      ).status,
    ).toBe(400);
    expect(
      call(
        `/api/tournaments/${id}`,
        "PUT",
        { ...input, description: "Updated description" },
        admin,
      ).status,
    ).toBe(204);
    expect(call(`/api/tournaments/${id}`).body.description).toBe(
      "Updated description",
    );
    expect(
      call(`/api/tournaments/${id}/publish`, "POST", undefined, admin).status,
    ).toBe(400);
  });

  it("registers, waitlists, promotes in order, cancels, and re-registers with consistent counts", () => {
    const id = createOpenTournament();
    const ana = login("ana@example.com"),
      luka = login("luka@example.com"),
      mariam = login("mariam@example.com");
    const first = call(
      `/api/tournaments/${id}/registrations`,
      "POST",
      undefined,
      ana,
    );
    expect(first).toMatchObject({
      status: 200,
      body: {
        tournamentId: id,
        userId: 235,
        status: 0,
        waitlistPosition: null,
        createdAt: expect.any(String),
      },
    });
    expect(
      call(`/api/tournaments/${id}/registrations`, "POST", undefined, ana)
        .status,
    ).toBe(409);
    expect(
      call(`/api/tournaments/${id}/registrations`, "POST", undefined, luka)
        .body,
    ).toMatchObject({ status: 1, waitlistPosition: 1 });
    expect(
      call(`/api/tournaments/${id}/registrations`, "POST", undefined, mariam)
        .body,
    ).toMatchObject({ status: 1, waitlistPosition: 2 });
    expect(
      call(`/api/tournaments/${id}`, "GET", undefined, luka).body
        .myRegistration,
    ).toMatchObject({ status: 1, waitlistPosition: 1 });
    expect(
      call(`/api/tournaments/${id}/registrations`, "GET", undefined, ana)
        .status,
    ).toBe(403);
    const admin = login();
    expect(
      call(
        `/api/tournaments/${id}/registrations?status=Waitlisted&pageSize=1`,
        "GET",
        undefined,
        admin,
      ).body,
    ).toMatchObject({
      totalCount: 2,
      totalPages: 2,
      items: [
        expect.objectContaining({ user: expect.objectContaining({ id: 236 }) }),
      ],
    });
    expect(
      call(`/api/tournaments/${id}/registrations/me`, "DELETE", undefined, ana)
        .status,
    ).toBe(204);
    expect(
      call(`/api/tournaments/${id}`, "GET", undefined, luka).body,
    ).toMatchObject({
      currentParticipants: 1,
      myRegistration: { status: 0, waitlistPosition: null },
    });
    expect(
      call(`/api/tournaments/${id}`, "GET", undefined, mariam).body
        .myRegistration,
    ).toMatchObject({ status: 1, waitlistPosition: 1 });
    expect(
      call(
        "/api/tournaments/my-registrations",
        "GET",
        undefined,
        ana,
      ).body.items.some((item) => item.tournamentId === id),
    ).toBe(false);
    expect(
      call(`/api/tournaments/${id}/registrations`, "POST", undefined, ana).body,
    ).toMatchObject({ id: first.body.id, status: 1, waitlistPosition: 2 });
    expect(
      call(`/api/tournaments/${id}/cancel`, "POST", undefined, admin).status,
    ).toBe(204);
    expect(call(`/api/tournaments/${id}`).status).toBe(404);
    expect(
      call(`/api/tournaments/${id}`, "GET", undefined, admin).body
        .currentParticipants,
    ).toBe(0);
    expect(
      call(
        "/api/tournaments/my-registrations",
        "GET",
        undefined,
        luka,
      ).body.items.some((item) => item.tournamentId === id),
    ).toBe(false);
  });

  it("advances lifecycle by time and enforces registration/cancellation deadlines", () => {
    const id = createOpenTournament();
    const player = login("ana@example.com");
    call(`/api/tournaments/${id}/registrations`, "POST", undefined, player);
    clock = START + 61_000;
    expect(call(`/api/tournaments/${id}`).body.status).toBe(3);
    expect(
      call(
        `/api/tournaments/${id}/registrations`,
        "POST",
        undefined,
        login("luka@example.com"),
      ).status,
    ).toBe(400);
    clock = START + 121_000;
    expect(
      call(
        `/api/tournaments/${id}/registrations/me`,
        "DELETE",
        undefined,
        player,
      ).status,
    ).toBe(400);
    clock = START + 181_000;
    expect(call(`/api/tournaments/${id}`).body.status).toBe(4);
    clock = START + 241_000;
    expect(call(`/api/tournaments/${id}`).body.status).toBe(5);
    expect(
      call(`/api/tournaments/${id}/cancel`, "POST", undefined, login()).status,
    ).toBe(400);
  });

  it("filters and paginates public tournaments and does not rebase persisted dates", () => {
    const expected = api
      .snapshot()
      .tournaments.filter(
        (item) =>
          item.clubId === 456 &&
          item.boardGameIds.includes(13) &&
          ![0, 6].includes(item.status),
      );
    const result = call(
      "/api/tournaments?clubId=456&boardGameId=13&type=MultiStage&location=chavchavadze&search=mars&pageSize=1",
    );
    expect(result.body).toMatchObject({
      totalCount: expected.length,
      items: [expect.objectContaining({ id: 700, tournamentType: 2 })],
    });
    const date = call("/api/tournaments/700").body.startsAt;
    clock += 86400_000;
    api = createMockApi(api.snapshot(), { now: () => clock });
    expect(call("/api/tournaments/700").body.startsAt).toBe(date);
    expect(
      call(
        `/api/tournaments?startsAfter=${encodeURIComponent(date)}`,
      ).body.items.every(
        (item) => Date.parse(item.startsAt) >= Date.parse(date),
      ),
    ).toBe(true);
  });
});

it("returns explicit errors for unknown routes/methods, malformed JSON and missing resources", () => {
  for (const path of [
    "/api/boardgames/999999",
    "/api/clubs/999999",
    "/api/tournaments/999999",
    "/api/clubs/456/unknown",
    "/api/tournaments/700/unknown",
  ])
    expect(call(path)).toMatchObject({
      status: 404,
      body: { status: 404, title: "Not Found" },
    });
  expect(call("/api/boardgames/13", "POST").status).toBe(404);
  expect(call("/api/auth/login", "POST", "{")).toMatchObject({
    status: 400,
    body: { detail: "Invalid JSON request body." },
  });
  expect(seed.tournaments[0].status).toBe("RegistrationOpen");
});
