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

  if (method === "POST" && matches(segments, ["api", "auth", "login"])) {
    const body = JSON.parse(String(options.body ?? "{}")) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      throw new ApiError(400, "Email and password are required");
    }
    return structuredClone(mockData.auth) as T;
  }

  if (method === "POST" && matches(segments, ["api", "users"])) {
    const body = JSON.parse(String(options.body ?? "{}")) as {
      nickname?: string;
    };
    if (!body.nickname) throw new ApiError(400, "Nickname is required");
    return {
      userId: 999,
      token: mockData.auth.token,
      message: "User account created successfully.",
    } as T;
  }

  if (
    method === "POST" &&
    matches(segments, ["api", "auth", "forgot-password"])
  ) {
    return { message: "Password recovery email sent." } as T;
  }

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

  if (matches(segments, ["api", "players"])) {
    const search = searchParams.get("search")?.trim().toLowerCase();
    return mockData.users
      .filter((user) => user.status === "Active")
      .filter(
        (user) =>
          !search ||
          [user.nickname, user.firstName, user.lastName]
            .some((value) => value.toLowerCase().includes(search)),
      )
      .map(toPublicPlayer);
  }

  if (segments[0] === "api" && segments[1] === "players" && segments[2]) {
    const user = mockData.users.find(
      (item) => item.id === Number(segments[2]) && item.status === "Active",
    );
    return user ? toPublicPlayerProfile(user) : undefined;
  }

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

function toPublicPlayer(user: (typeof mockData.users)[number]) {
  return {
    id: user.id,
    nickname: user.nickname,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt,
  };
}

function toPublicPlayerProfile(user: (typeof mockData.users)[number]) {
  const rankings = mockData.platformLeaderboards
    .filter((entry) => entry.userId === user.id)
    .map((entry) => ({
      gameId: entry.gameId,
      season: entry.season,
      rank: entry.rank,
      ratingPoints: entry.ratingPoints,
    }));
  const currentSeason = rankings
    .map((entry) => entry.season)
    .sort((first, second) => second.localeCompare(first))[0];
  const currentEntries = mockData.platformLeaderboards.filter(
    (entry) => entry.userId === user.id && entry.season === currentSeason,
  );
  const tournaments = mockData.tournamentRegistrations
    .filter((registration) => registration.userId === user.id)
    .map((registration) => {
      const tournament = mockData.tournaments.find(
        (item) => item.id === registration.tournamentId,
      );
      return tournament
        ? {
            tournamentId: tournament.id,
            name: tournament.name,
            startsAt: tournament.startsAt,
            city: tournament.city,
            status: registration.status,
          }
        : undefined;
    })
    .filter((tournament) => tournament !== undefined);

  return {
    ...toPublicPlayer(user),
    stats: {
      ratingPoints: currentEntries.reduce(
        (total, entry) => total + entry.ratingPoints,
        0,
      ),
      tournamentsPlayed: currentEntries.reduce(
        (total, entry) => total + entry.tournamentsPlayed,
        0,
      ),
      wins: currentEntries.reduce((total, entry) => total + entry.wins, 0),
      bestFinish: currentEntries.length
        ? Math.min(...currentEntries.map((entry) => entry.bestFinish))
        : null,
    },
    rankings,
    tournaments,
  };
}
