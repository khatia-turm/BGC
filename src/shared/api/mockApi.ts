import mockData from "../../../mock-be/mock-data.json";
import { ApiError } from "./errors";

const MOCK_DELAY_MS = 250;
type MockRegistration = {
  id: number;
  tournamentId: number;
  userId: number;
  status: string;
  registeredAt: string;
};
const mockRegistrations: MockRegistration[] = structuredClone(
  mockData.tournamentRegistrations,
);
let currentMockUser = structuredClone(mockData.currentUser);
const mockNotifications: Array<{id:string;userId:number;type:"Registration"|"Waitlist"|"Promotion"|"Reminder"|"Cancellation";title:string;message:string;createdAt:string;tournamentId?:number}> = [];
let mockClubRequest: { clubId:number;clubName:string;status:"Pending"|"Rejected";submittedAt:string;adminNote:null|string } | null = null;

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
    const matchedUser = mockData.users.find((user) => user.email.toLowerCase() === body.email?.toLowerCase());
    if (matchedUser) currentMockUser = { ...currentMockUser, ...matchedUser, clubs: mockData.currentUser.clubs };
    return {
      token: mockData.auth.token,
      expiresAt: mockData.auth.expiresAt,
      userId: matchedUser?.id ?? currentMockUser.id,
      nickname: matchedUser?.nickname ?? currentMockUser.nickname,
      firstName: matchedUser?.firstName ?? currentMockUser.firstName,
      lastName: matchedUser?.lastName ?? currentMockUser.lastName,
    } as T;
  }

  if (method === "POST" && matches(segments, ["api", "users"])) {
    const body = JSON.parse(String(options.body ?? "{}")) as Record<string, string | number | undefined>;
    if (!body.nickname) throw new ApiError(400, "Nickname is required");
    const userId = Math.max(...mockData.users.map((user) => user.id)) + 1;
    const newUser = {
      id:userId, nickname:String(body.nickname), firstName:String(body.firstName ?? ""), lastName:String(body.lastName ?? ""), birthday:String(body.birthday ?? ""), gender:Number(body.gender) === 1 ? "Female" : Number(body.gender) === 2 ? "Other" : "Male", email:String(body.email ?? ""), phone:String(body.phone ?? ""), avatarUrl:null, status:"Active", adminNote:null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), deletedAt:null,
    };
    (mockData.users as unknown as Array<typeof newUser>).push(newUser);
    currentMockUser = { ...currentMockUser, ...newUser, avatarUrl:"", clubs:[] };
    return {
      userId,
      token: mockData.auth.token,
      message: "User account created successfully.",
    } as T;
  }

  if (method === "PATCH" && segments[0] === "api" && segments[1] === "users" && segments.length === 3) {
    const user = mockData.users.find((item) => item.id === Number(segments[2]));
    if (!user) throw new ApiError(404, "User not found");
    const body = JSON.parse(String(options.body ?? "{}")) as Partial<typeof user>;
    Object.assign(user, body, { updatedAt: new Date().toISOString() });
    if (user.id === currentMockUser.id) currentMockUser = { ...currentMockUser, ...body, updatedAt:user.updatedAt };
    return structuredClone(user) as T;
  }

  if (method === "POST" && matches(segments, ["api", "clubs"])) {
    const body = JSON.parse(String(options.body ?? "{}")) as Record<string, string>;
    if (!body.name || !body.address || !body.city || !body.email || !body.phone) throw new ApiError(400, "Required club details are missing");
    if (mockData.clubs.some((club) => String(club.name).toLowerCase() === body.name.toLowerCase())) throw new ApiError(409, "A club with this name already exists");
    if (mockClubRequest?.status === "Pending") throw new ApiError(409, "You already have a club application waiting for approval");
    const clubId = Math.max(...mockData.clubs.map((club) => club.id)) + 1;
    mockClubRequest = { clubId, clubName:body.name, status:"Pending", submittedAt:new Date().toISOString(), adminNote:null };
    return { clubId, status: "Pending", message: "Club application submitted successfully and is awaiting admin approval." } as T;
  }
  if (method === "PATCH" && segments[0] === "api" && segments[1] === "clubs" && segments.length === 3) {
    const club=mockData.clubs.find((item)=>item.id===Number(segments[2]));
    if(!club)throw new ApiError(404,"Club not found");
    Object.assign(club,JSON.parse(String(options.body??"{}")),{updatedAt:new Date().toISOString()});return structuredClone(club) as T;
  }
  if(method==="PATCH"&&segments[0]==="api"&&segments[1]==="tournament-registrations"&&segments[3]==="status"){
    const registration=mockRegistrations.find((item)=>item.id===Number(segments[2]));if(!registration)throw new ApiError(404,"Registration request not found");const body=JSON.parse(String(options.body??"{}")) as {status:string};registration.status=body.status;return structuredClone(registration) as T;
  }

  if (
    method === "POST" &&
    matches(segments, ["api", "auth", "forgot-password"])
  ) {
    return { message: "Password recovery email sent." } as T;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "tournaments" && segments[2] && segments[3] === "participants") {
    const tournamentId = Number(segments[2]);
    const userIds = mockRegistrations.filter((item) => item.tournamentId === tournamentId && item.status !== "Waitlisted").map((item) => item.userId);
    return mockData.users.filter((user) => userIds.includes(user.id)).map((user) => ({ id: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl })) as T;
  }

  if (
    segments[0] === "api" &&
    segments[1] === "tournaments" &&
    segments[2] &&
    segments[3] === "registration"
  ) {
    const tournamentId = Number(segments[2]);
    const tournament = mockData.tournaments.find((item) => item.id === tournamentId);
    if (!tournament) throw new ApiError(404, "Tournament not found");
    const existingIndex = mockRegistrations.findIndex(
      (item) => item.tournamentId === tournamentId && item.userId === currentMockUser.id,
    );
    if (method === "POST") {
      const body = JSON.parse(String(options.body ?? "{}")) as { agreementAccepted?: boolean };
      if (!body.agreementAccepted) throw new ApiError(400, "Tournament rules must be accepted");
      if (existingIndex >= 0) throw new ApiError(409, "You are already registered");
      const status = tournament.registeredPlayers >= tournament.maxPlayers ? "Waitlisted" : "Accepted";
      const registration = {
        id: Date.now(), tournamentId, userId: currentMockUser.id, status, registeredAt: new Date().toISOString(),
      };
      mockRegistrations.push(registration);
      if (status === "Accepted") tournament.registeredPlayers += 1;
      mockNotifications.unshift({ id:`registration-${registration.id}`, userId:currentMockUser.id, type:status === "Accepted" ? "Registration" : "Waitlist", title:status === "Accepted" ? "Registration confirmed" : "Added to waitlist", message:status === "Accepted" ? `You are registered for ${tournament.name}.` : `You joined the waitlist for ${tournament.name}.`, createdAt:new Date().toISOString(), tournamentId });
      return toRegistrationResponse(registration, tournament.registrationClosesAt) as T;
    }
    if (method === "DELETE") {
      if (existingIndex < 0) throw new ApiError(404, "Registration not found");
      const [registration] = mockRegistrations.splice(existingIndex, 1);
      if (registration.status === "Accepted") tournament.registeredPlayers -= 1;
      mockNotifications.unshift({ id:`cancel-${Date.now()}`, userId:currentMockUser.id, type:"Cancellation", title:"Registration cancelled", message:`Your registration for ${tournament.name} was cancelled.`, createdAt:new Date().toISOString(), tournamentId });
      const promoted = mockRegistrations.find((item) => item.tournamentId === tournamentId && item.status === "Waitlisted");
      if (promoted) { promoted.status = "Accepted"; tournament.registeredPlayers += 1; mockNotifications.unshift({ id:`promotion-${Date.now()}`, userId:promoted.userId, type:"Promotion", title:"Moved from waitlist", message:`A spot opened up—you are now registered for ${tournament.name}.`, createdAt:new Date().toISOString(), tournamentId }); }
      return undefined as T;
    }
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
  if (matches(segments,["api","clubs","my-request"])) return mockClubRequest;
  if (matches(segments,["api","notifications"])) {
    const reminders = mockRegistrations.filter((item)=>item.userId===currentMockUser.id).flatMap((registration)=>{const tournament=mockData.tournaments.find((item)=>item.id===registration.tournamentId);if(!tournament)return [];const remaining=new Date(tournament.startsAt).getTime()-Date.now();return remaining>0&&remaining<=86400000?[{id:`reminder-${tournament.id}`,userId:currentMockUser.id,type:"Reminder" as const,title:"Tournament reminder",message:`${tournament.name} starts within one day.`,createdAt:new Date().toISOString(),tournamentId:tournament.id}]:[];});
    return [...reminders,...mockNotifications.filter((item)=>item.userId===currentMockUser.id)];
  }
  if (
    segments[0] === "api" && segments[1] === "tournaments" &&
    segments[2] && segments[3] === "registration"
  ) {
    const tournamentId = Number(segments[2]);
    const tournament = mockData.tournaments.find((item) => item.id === tournamentId);
    const registration = mockRegistrations.find(
      (item) => item.tournamentId === tournamentId && item.userId === currentMockUser.id,
    );
    return registration && tournament
      ? toRegistrationResponse(registration, tournament.registrationClosesAt)
      : null;
  }
  if (matches(segments, ["api", "auth", "me"])) return currentMockUser;
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
      const tournamentIds=mockData.tournaments.filter((item)=>item.clubId===clubId).map((item)=>item.id);
      const registrations=mockRegistrations.filter((item)=>tournamentIds.includes(item.tournamentId));
      return {clubId,pendingMembers:registrations.filter((item)=>item.status==="Pending").length,upcomingTournaments:mockData.tournaments.filter((item)=>item.clubId===clubId&&new Date(item.startsAt)>new Date()).length,totalPlayers:new Set(registrations.map((item)=>item.userId)).size};
    }
    if (segments[3] === "staff") return mockData.userClubs.filter((item)=>item.clubId===clubId).map((item)=>{const user=mockData.users.find((candidate)=>candidate.id===item.userId)!;return {id:user.id,nickname:user.nickname,email:user.email,avatarUrl:user.avatarUrl??"",role:item.role};});
    if(segments[3]==="registration-requests"){const tournamentIds=mockData.tournaments.filter((item)=>item.clubId===clubId).map((item)=>item.id);return mockRegistrations.filter((item)=>tournamentIds.includes(item.tournamentId)&&item.status==="Pending").map((item)=>{const user=mockData.users.find((candidate)=>candidate.id===item.userId)!;const tournament=mockData.tournaments.find((candidate)=>candidate.id===item.tournamentId)!;const game=mockData.games.find((candidate)=>candidate.id===tournament.gameId)!;const rating=mockData.platformLeaderboards.find((entry)=>entry.userId===user.id&&entry.gameId===game.id)?.ratingPoints??null;return{id:item.id,tournamentId:tournament.id,tournamentName:tournament.name,gameTitle:game.title,userId:user.id,nickname:user.nickname,avatarUrl:user.avatarUrl,rating,registeredAt:item.registeredAt,status:item.status};});}
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

  if (matches(segments, ["api", "tournaments"])) return mockData.tournaments.map(withTournamentCounts);
  if (segments[0] === "api" && segments[1] === "tournaments" && segments[2]) {
    const tournament = mockData.tournaments.find(
      (tournament) => tournament.id === Number(segments[2]),
    );
    return tournament ? withTournamentCounts(tournament) : undefined;
  }

  return undefined;
}

function withTournamentCounts(tournament: (typeof mockData.tournaments)[number]) {
  return { ...tournament, waitlistCount: mockRegistrations.filter((item) => item.tournamentId === tournament.id && item.status === "Waitlisted").length };
}

function toRegistrationResponse(registration: MockRegistration, cancellationClosesAt: string) {
  return {
    id: registration.id,
    tournamentId: registration.tournamentId,
    status: registration.status === "Waitlisted" ? "Waitlisted" : "Accepted",
    registeredAt: registration.registeredAt,
    cancellationClosesAt,
  };
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
  const tournaments = mockRegistrations
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
