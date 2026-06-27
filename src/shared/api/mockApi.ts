import mockData from "../../../mock-be/mock-data.json";
import { ApiError } from "./errors";

const MOCK_DELAY_MS = 250;

export async function mockRequest<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  await delay(MOCK_DELAY_MS);

  const method = options.method?.toUpperCase() ?? "GET";
  const url = new URL(path, "http://mock-api.local");
  const segments = url.pathname.split("/").filter(Boolean);

  if (method !== "GET") {
    throw new ApiError(
      501,
      `Mock ${method} ${url.pathname} is not implemented`,
    );
  }

  const result = resolveGet(segments, url.searchParams);

  if (result === undefined) {
    throw new ApiError(404, `Mock endpoint GET ${url.pathname} was not found`);
  }

  return structuredClone(result) as T;
}

function resolveGet(
  segments: string[],
  searchParams: URLSearchParams,
): unknown {
  if (matches(segments, ["api", "auth", "me"])) return mockData.currentUser;
  if (matches(segments, ["api", "games", "categories"]))
    return mockData.categories;

  if (matches(segments, ["api", "games"])) {
    const search = searchParams.get("search")?.toLowerCase();
    const categoryId = toNumber(searchParams.get("categoryId"));
    const clubId = toNumber(searchParams.get("clubId"));

    return mockData.games.filter((game) => {
      const matchesSearch =
        !search || game.title.toLowerCase().includes(search);
      const matchesCategory =
        !categoryId || game.categoryIds.includes(categoryId);
      const matchesClub =
        !clubId ||
        mockData.clubGames.some(
          (item) => item.clubId === clubId && item.gameId === game.id,
        );
      return matchesSearch && matchesCategory && matchesClub;
    });
  }

  if (segments[0] === "api" && segments[1] === "games" && segments[2]) {
    return mockData.games.find((game) => game.id === Number(segments[2]));
  }

  if (matches(segments, ["api", "users"])) {
    const status = searchParams.get("status");
    return mockData.users.filter((user) => !status || user.status === status);
  }

  if (matches(segments, ["api", "leaderboards"])) {
    const gameId = toNumber(searchParams.get("gameId"));
    const season = searchParams.get("season");
    return mockData.platformLeaderboards.filter(
      (entry) =>
        (!gameId || entry.gameId === gameId) &&
        (!season || entry.season === season),
    );
  }

  if (segments[0] === "api" && segments[1] === "users" && segments[2]) {
    const userId = Number(segments[2]);
    if (segments[3] === "clubs") {
      const clubIds = mockData.userClubs
        .filter((item) => item.userId === userId)
        .map((item) => item.clubId);
      return mockData.clubs.filter((club) => clubIds.includes(club.id));
    }
    return mockData.users.find((user) => user.id === userId);
  }

  if (matches(segments, ["api", "clubs"])) {
    const status = searchParams.get("status");
    const ownerId = toNumber(searchParams.get("ownerId"));
    return mockData.clubs.filter((club) => {
      const matchesStatus = !status || club.status === status;
      const matchesOwner =
        !ownerId ||
        mockData.userClubs.some(
          (item) => item.userId === ownerId && item.clubId === club.id,
        );
      return matchesStatus && matchesOwner;
    });
  }

  if (segments[0] === "api" && segments[1] === "clubs" && segments[2]) {
    const clubId = Number(segments[2]);
    if (segments[3] === "dashboard") {
      return mockData.clubDashboard.clubId === clubId
        ? mockData.clubDashboard
        : undefined;
    }
    if (segments[3] === "games") {
      const gameIds = mockData.clubGames
        .filter((item) => item.clubId === clubId && item.deletedAt === null)
        .map((item) => item.gameId);
      return mockData.games.filter((game) => gameIds.includes(game.id));
    }
    if (segments[3] === "leaderboards") {
      const gameId = toNumber(searchParams.get("gameId"));
      const season = searchParams.get("season");
      return mockData.clubLeaderboards.filter(
        (entry) =>
          entry.clubId === clubId &&
          (!gameId || entry.gameId === gameId) &&
          (!season || entry.season === season),
      );
    }
    return mockData.clubs.find((club) => club.id === clubId);
  }

  if (matches(segments, ["api", "tournaments"])) return mockData.tournaments;
  if (segments[0] === "api" && segments[1] === "tournaments" && segments[2]) {
    return mockData.tournaments.find(
      (tournament) => tournament.id === Number(segments[2]),
    );
  }

  return undefined;
}

function matches(actual: string[], expected: string[]) {
  return (
    actual.length === expected.length &&
    actual.every((part, i) => part === expected[i])
  );
}

function toNumber(value: string | null) {
  return value ? Number(value) : undefined;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
