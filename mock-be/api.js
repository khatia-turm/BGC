// Shared contract implementation for HTTP and browser mocks. Keep DTOs and rules
// aligned with meeplehub-api's controllers, services, validators and repositories.
const TOURNAMENT_STATUSES = [
  "Draft",
  "Published",
  "RegistrationOpen",
  "RegistrationClosed",
  "InProgress",
  "Finished",
  "Cancelled",
];
const TOURNAMENT_TYPES = ["League", "Knockout", "MultiStage"];
const REGISTRATION_STATUSES = ["Accepted", "Waitlisted", "Cancelled"];
const CLUB_STATUSES = ["Pending", "Active", "Rejected", "Suspended", "Deleted"];
const USER_STATUSES = ["Active", "Suspended", "Deleted"];
const GENDERS = ["Male", "Female", "Other"];
export const MOCK_STATE_VERSION = 1;

class MockError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
const fail = (status, message, errors) => {
  throw new MockError(status, message, errors);
};
const required = (value, message = "Resource not found.") =>
  value ?? fail(404, message);
const nextId = (items) => Math.max(0, ...items.map((item) => item.id)) + 1;
const clean = (value) => (typeof value === "string" ? value.trim() : "");
const lower = (value) => clean(value).toLowerCase();
const pick = (value, keys) =>
  Object.fromEntries(keys.map((key) => [key, value[key]]));
const enumValue = (value, values, field) => {
  const index =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? Number(value)
      : values.findIndex((item) => lower(item) === lower(value));
  if (!Number.isInteger(index) || index < 0 || index >= values.length)
    fail(400, `${field} is invalid.`);
  return index;
};
const integer = (value, field, min = 1) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min)
    fail(400, `'${field}' must be an integer greater than or equal to ${min}.`);
  return number;
};
function page(items, params, defaultSize = 10, clamp = false) {
  let page = integer(
    params.get("page") ?? 1,
    "page",
    clamp ? -Number.MAX_SAFE_INTEGER : 1,
  );
  let pageSize = integer(
    params.get("pageSize") ?? defaultSize,
    "pageSize",
    clamp ? -Number.MAX_SAFE_INTEGER : 1,
  );
  if (clamp) {
    page = Math.max(1, page);
    pageSize = pageSize < 1 ? defaultSize : Math.min(pageSize, 100);
  } else if (pageSize > 100)
    fail(400, "'pageSize' must be less than or equal to 100.");
  return {
    page,
    pageSize,
    totalCount: items.length,
    totalPages: Math.ceil(items.length / pageSize),
    items: items.slice((page - 1) * pageSize, page * pageSize),
  };
}
function validate(body, rules) {
  const errors = {};
  for (const [field, check] of Object.entries(rules)) {
    const message = check(body[field]);
    if (message) errors[field] = [message];
  }
  if (Object.keys(errors).length)
    fail(400, "Please fix the highlighted fields.", errors);
}
const textRule =
  (label, max, optional = false) =>
  (value) =>
    optional && value == null
      ? null
      : !optional && !clean(value)
        ? `${label} is required.`
        : typeof value !== "string" || value.length > max
          ? `${label} must not exceed ${max} characters.`
          : null;
const emailRule = (value) =>
  !clean(value) || !/^[^\s@]+@[^\s@]+$/.test(value) || value.length > 254
    ? "A valid email is required."
    : null;
const passwordRule = (value) =>
  typeof value !== "string" ||
  value.length < 8 ||
  !/[A-Z]/.test(value) ||
  !/[a-z]/.test(value) ||
  !/[0-9]/.test(value) ||
  !/[^a-zA-Z0-9]/.test(value)
    ? "Password must be at least 8 characters and contain uppercase, lowercase, a digit, and a special character."
    : null;
const base64 = (value) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const decode = (value) =>
  JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(
        atob(value.replace(/-/g, "+").replace(/_/g, "/")),
        (char) => char.charCodeAt(0),
      ),
    ),
  );

export function createMockApi(
  seed,
  { now = Date.now, rebaseDates = true } = {},
) {
  let db = structuredClone(seed);
  if (db.mockStateVersion !== MOCK_STATE_VERSION) {
    db.mockStateVersion = MOCK_STATE_VERSION;
    db.passwordResetTokens = [];
    db.notifications ??= [];
    db.bggCatalog = structuredClone(db.games);
    // Only fresh fixtures move in time. Persisted/user-created dates never move.
    db.tournaments = db.tournaments.map((item, index) => {
      const status = enumValue(item.status, TOURNAMENT_STATUSES, "status");
      const start = now() + (7 + index * 3) * 86400_000;
      const dates = rebaseDates
        ? {
            registrationOpensAt: new Date(
              status === 0 || status === 1
                ? now() + 86400_000
                : now() - 86400_000,
            ).toISOString(),
            registrationClosesAt: new Date(start - 2 * 86400_000).toISOString(),
            cancellationDeadline: new Date(start - 86400_000).toISOString(),
            startsAt: new Date(start).toISOString(),
            endsAt: new Date(start + 6 * 3600_000).toISOString(),
          }
        : {};
      if (rebaseDates && status >= 3 && status <= 5) {
        dates.registrationOpensAt = new Date(
          now() - 5 * 86400_000,
        ).toISOString();
        dates.registrationClosesAt = new Date(
          now() - 3 * 86400_000,
        ).toISOString();
        dates.cancellationDeadline = new Date(
          now() - 2 * 86400_000,
        ).toISOString();
        dates.startsAt = new Date(
          now() + (status === 3 ? 3600_000 : -3600_000),
        ).toISOString();
        dates.endsAt = new Date(
          now() + (status === 5 ? -1800_000 : 6 * 3600_000),
        ).toISOString();
      }
      return {
        ...pick(item, [
          "id",
          "clubId",
          "name",
          "description",
          "startsAt",
          "endsAt",
          "registrationOpensAt",
          "registrationClosesAt",
          "createdAt",
          "updatedAt",
          "entryFee",
        ]),
        status,
        tournamentType: enumValue(
          item.tournamentType ??
            (item.type === "Multi-stage" ? "MultiStage" : item.type),
          TOURNAMENT_TYPES,
          "tournamentType",
        ),
        cancellationDeadline:
          item.cancellationDeadline ?? item.registrationClosesAt,
        minParticipants: item.minParticipants ?? 2,
        maxParticipants: item.maxParticipants ?? item.maxPlayers,
        location: item.location ?? item.venue ?? item.city,
        boardGameIds: item.boardGameIds ??
          item.boardGames?.map((game) => game.boardGameId) ?? [item.gameId],
        ...dates,
      };
    });
    db.tournamentRegistrations = db.tournamentRegistrations.map((item) => ({
      id: item.id,
      tournamentId: item.tournamentId,
      userId: item.userId,
      status: enumValue(
        item.status === "CheckedIn"
          ? "Accepted"
          : item.status === "Pending"
            ? "Waitlisted"
            : item.status,
        REGISTRATION_STATUSES,
        "status",
      ),
      waitlistPosition: item.waitlistPosition ?? null,
      createdAt: item.createdAt ?? item.registeredAt,
      updatedAt: item.updatedAt ?? item.registeredAt,
    }));
    for (const tournament of db.tournaments) renumber(tournament.id);
  }

  const timestamp = () => new Date(now()).toISOString();
  const clubById = (id) =>
    required(
      db.clubs.find((club) => club.id === Number(id)),
      "Club not found.",
    );
  const userById = (id) =>
    required(
      db.users.find((user) => user.id === Number(id)),
      "User not found.",
    );
  const tournamentById = (id) =>
    required(
      db.tournaments.find((item) => item.id === Number(id)),
      "Tournament not found.",
    );
  const memberships = (user) =>
    db.userClubs.filter(
      (item) => item.userId === user.id && item.role === "Admin",
    );
  const isClubAdmin = (user, clubId) =>
    Boolean(user && memberships(user).some((item) => item.clubId === clubId));
  const rolesFor = (user) => [
    ...(user.roles?.includes("AppAdmin") ? ["AppAdmin"] : []),
    memberships(user).length ? "ClubAdmin" : "Player",
  ];
  const tokenFor = (user) =>
    `${base64({ alg: "none", typ: "JWT" })}.${base64({ UserId: String(user.id), email: user.email, unique_name: user.nickname, role: rolesFor(user), exp: Math.floor(now() / 1000) + 3600 })}.mock`;
  const active = (user) => {
    if (user.status !== "Active") fail(403, "User is not active.");
    return user;
  };
  const manageClub = (user, clubId) => {
    active(user);
    const club = clubById(clubId);
    if (!isClubAdmin(user, club.id))
      fail(403, "Club administrator access is required.");
    if (club.status !== "Active")
      fail(403, "Only Active clubs can be managed.");
    return club;
  };
  const registrations = (id) =>
    db.tournamentRegistrations.filter((item) => item.tournamentId === id);
  const acceptedCount = (id) =>
    registrations(id).filter((item) => item.status === 0).length;
  function renumber(id) {
    db.tournamentRegistrations
      .filter((item) => item.tournamentId === id && item.status === 1)
      .sort(
        (a, b) =>
          (a.waitlistPosition ?? Infinity) - (b.waitlistPosition ?? Infinity) ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id - b.id,
      )
      .forEach((item, index) => {
        item.waitlistPosition = index + 1;
      });
  }
  function lifecycle() {
    for (const item of db.tournaments) {
      const previous = item.status;
      if (item.status === 1 && Date.parse(item.registrationOpensAt) <= now())
        item.status = 2;
      if (item.status === 2 && Date.parse(item.registrationClosesAt) <= now())
        item.status = 3;
      if (item.status === 3 && Date.parse(item.startsAt) <= now())
        item.status = 4;
      if (item.status === 4 && item.endsAt && Date.parse(item.endsAt) <= now())
        item.status = 5;
      if (previous !== item.status) item.updatedAt = timestamp();
    }
  }
  const publicUser = (user) => ({
    ...pick(user, ["id", "nickname", "firstName", "lastName", "email"]),
    avatarUrl: user.avatarUrl ?? "",
  });
  const detailUser = (user) => ({
    ...publicUser(user),
    ...pick(user, ["birthday", "gender", "phone", "status", "updatedAt"]),
  });
  const clubList = (club) => ({
    clubId: club.id,
    ...pick(club, ["name", "city", "status"]),
    logoUrl: club.logoUrl ?? "",
    description: club.description ?? "",
  });
  const clubDetail = (club) => ({
    clubId: club.id,
    ...pick(club, ["name", "address", "city", "email"]),
    logoUrl: club.logoUrl ?? "",
    description: club.description ?? "",
    phone: club.phone ?? "",
    workingHours: club.workingHours ?? "",
  });
  const boardGame = (game) => ({
    boardGameId: game.id,
    ...pick(game, [
      "title",
      "year",
      "minPlayers",
      "maxPlayers",
      "minPlayingTime",
      "maxPlayingTime",
      "complexity",
      "bggOverallRank",
      "bggGeekRating",
      "bggAvgRating",
      "bggVoters",
    ]),
    description: game.description ?? "",
    imageUrl: game.imageUrl ?? "",
    bestPlayersCount:
      game.bestPlayersCount ?? game.bggCommunityPlayerCounts?.best[0] ?? null,
    minPlayerAge: game.minPlayerAge ?? null,
    suggestedPlayerAge: game.suggestedPlayerAge ?? null,
    categories: db.categories
      .filter((category) => game.categoryIds.includes(category.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => pick(category, ["id", "name"])),
  });
  const tournamentList = (item) => ({
    ...pick(item, [
      "id",
      "clubId",
      "name",
      "tournamentType",
      "status",
      "startsAt",
      "endsAt",
      "location",
      "entryFee",
      "maxParticipants",
    ]),
    clubName: clubById(item.clubId).name,
    currentParticipants: acceptedCount(item.id),
  });
  const registrationSummary = (item) =>
    item
      ? {
          registrationId: item.id,
          status: item.status,
          waitlistPosition: item.waitlistPosition,
          registeredAt: item.createdAt,
        }
      : null;
  const tournamentGames = (item) =>
    item.boardGameIds.map((id) => {
      const game = required(
        db.games.find((game) => game.id === id),
        "Board game not found.",
      );
      return {
        boardGameId: game.id,
        title: game.title,
        imageUrl: game.imageUrl ?? "",
        year: game.year,
      };
    });
  const tournamentDetail = (item, user) => ({
    ...tournamentList(item),
    ...pick(item, [
      "description",
      "registrationOpensAt",
      "registrationClosesAt",
      "cancellationDeadline",
      "minParticipants",
    ]),
    boardGames: tournamentGames(item),
    myRegistration: registrationSummary(
      registrations(item.id).find(
        (registration) => registration.userId === user?.id,
      ),
    ),
  });
  const tournamentCreated = (item) => ({
    ...pick(item, [
      "id",
      "clubId",
      "name",
      "description",
      "tournamentType",
      "status",
      "startsAt",
      "endsAt",
      "registrationOpensAt",
      "registrationClosesAt",
      "cancellationDeadline",
      "minParticipants",
      "maxParticipants",
      "location",
      "entryFee",
      "createdAt",
    ]),
    boardGames: tournamentGames(item),
  });

  function validateUser(body, creating) {
    const rules = {};
    for (const [key, max] of Object.entries({
      nickname: 50,
      firstName: 100,
      lastName: 100,
      phone: 20,
    })) {
      if (creating || body[key] != null)
        rules[key] = textRule(key, max, !creating);
    }
    if (creating)
      Object.assign(rules, { email: emailRule, password: passwordRule });
    if (creating || body.birthday != null)
      rules.birthday = (value) =>
        !Number.isFinite(Date.parse(value)) || Date.parse(value) >= now()
          ? "Birthday must be in the past."
          : null;
    if (creating || body.gender != null)
      rules.gender = (value) =>
        value == null || ![0, 1, 2].includes(value)
          ? "Gender is invalid."
          : null;
    validate(body, rules);
    if (
      !creating &&
      ![
        "nickname",
        "firstName",
        "lastName",
        "phone",
        "avatarUrl",
        "birthday",
        "gender",
      ].some((key) => (key === "gender" ? body[key] != null : clean(body[key])))
    )
      fail(400, "At least one field must be provided for update.");
  }
  function validateClub(body, excludedId) {
    validate(body, {
      name: textRule("Club name", 100),
      address: textRule("Address", 200),
      city: textRule("City", 100),
      email: emailRule,
    });
    if (
      db.clubs.some(
        (club) =>
          club.id !== excludedId && lower(club.name) === lower(body.name),
      )
    )
      fail(409, "A club with this name already exists.");
    return {
      name: clean(body.name),
      address: clean(body.address),
      city: clean(body.city),
      email: lower(body.email),
      ...Object.fromEntries(
        ["description", "phone", "logoUrl", "workingHours"].map((key) => [
          key,
          clean(body[key]) || null,
        ]),
      ),
    };
  }
  function validateDates(body) {
    for (const key of [
      "registrationOpensAt",
      "registrationClosesAt",
      "cancellationDeadline",
      "startsAt",
      ...(body.endsAt != null ? ["endsAt"] : []),
    ]) {
      if (
        typeof body[key] !== "string" ||
        !/(Z|\+00:00)$/i.test(body[key]) ||
        !Number.isFinite(Date.parse(body[key]))
      )
        fail(400, "All tournament date/time values must be provided in UTC.");
    }
    if (
      !(
        Date.parse(body.registrationOpensAt) <
          Date.parse(body.registrationClosesAt) &&
        Date.parse(body.registrationClosesAt) <=
          Date.parse(body.cancellationDeadline) &&
        Date.parse(body.cancellationDeadline) < Date.parse(body.startsAt)
      )
    )
      fail(
        400,
        "Invalid dates. Required: RegistrationOpensAt < RegistrationClosesAt <= CancellationDeadline < StartsAt.",
      );
    if (body.endsAt && Date.parse(body.endsAt) <= Date.parse(body.startsAt))
      fail(400, "EndsAt must be after StartsAt when provided.");
  }
  function tournamentInput(body, clubId, full = true) {
    validate(body, {
      name: textRule("Name", 200),
      description: textRule("Description", 4000),
      location: textRule("Location", 300),
    });
    const tournamentType = enumValue(
      body.tournamentType,
      TOURNAMENT_TYPES,
      "tournamentType",
    );
    const minParticipants = integer(body.minParticipants, "minParticipants");
    const maxParticipants = integer(
      body.maxParticipants,
      "maxParticipants",
      minParticipants,
    );
    if (
      !Array.isArray(body.boardGameIds) ||
      !body.boardGameIds.length ||
      body.boardGameIds.some((id) => !Number.isInteger(id) || id <= 0)
    )
      fail(400, "At least one valid board game must be assigned.");
    const boardGameIds = [...new Set(body.boardGameIds)];
    if (
      body.entryFee != null &&
      (typeof body.entryFee !== "number" ||
        !Number.isFinite(body.entryFee) ||
        body.entryFee < 0)
    )
      fail(400, "Entry fee must be greater than or equal to 0.");
    if (full) {
      validateDates(body);
      if (boardGameIds.some((id) => !db.games.some((game) => game.id === id)))
        fail(400, "Board games not found in local database.");
      if (
        boardGameIds.some(
          (id) =>
            !db.clubGames.some(
              (item) =>
                item.clubId === clubId && item.gameId === id && !item.deletedAt,
            ),
        )
      )
        fail(
          400,
          "One or more selected board games are not in this club catalog.",
        );
    }
    return {
      name: clean(body.name),
      description: clean(body.description),
      location: clean(body.location),
      tournamentType,
      minParticipants,
      maxParticipants,
      boardGameIds,
      ...pick(body, [
        "registrationOpensAt",
        "registrationClosesAt",
        "cancellationDeadline",
        "startsAt",
      ]),
      endsAt: body.endsAt ?? null,
      entryFee: body.entryFee ?? null,
    };
  }

  function dispatch(path, { method = "GET", headers, body: rawBody } = {}) {
    method = method.toUpperCase();
    const url = new URL(path, "http://mock.local");
    const parts = url.pathname
      .replace(/\/$/, "")
      .toLowerCase()
      .split("/")
      .filter(Boolean);
    const route = parts.join("/");
    const params = new URLSearchParams(
      [...url.searchParams].map(([key, value]) => [key.toLowerCase(), value]),
    );
    // ASP.NET binds request and query property names case-insensitively.
    const query = {
      get: (key) => params.get(key.toLowerCase()),
      has: (key) => params.has(key.toLowerCase()),
    };
    let body = {};
    if (rawBody !== undefined && rawBody !== "") {
      try {
        body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      } catch {
        fail(400, "Invalid JSON request body.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        fail(400, "A JSON object is required.");
      body = Object.fromEntries(
        Object.entries(body).map(([key, value]) => [
          key.charAt(0).toLowerCase() + key.slice(1),
          value,
        ]),
      );
    }
    let user;
    let claims;
    try {
      const token = new Headers(headers)
        .get("Authorization")
        ?.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (token?.split(".").length === 3 && token.endsWith(".mock")) {
        const payload = decode(token.split(".")[1]);
        if (payload.exp > now() / 1000) {
          user = db.users.find((item) => item.id === Number(payload.UserId));
          claims = payload;
        }
      }
    } catch {
      /* Invalid credentials are handled by protected routes below. */
    }
    const auth = () => user ?? fail(401, "A valid Bearer token is required.");
    const role = (name) => {
      auth();
      if (![claims.role ?? []].flat().includes(name))
        fail(403, `${name} access is required.`);
      return user;
    };
    const ok = (body, status = 200) => ({ status, body });
    const empty = () => ({ status: 204 });

    if (route === "api/auth/login" && method === "POST") {
      validate(body, {
        email: emailRule,
        password: textRule("Password", Infinity),
      });
      const account = db.users.find(
        (item) => lower(item.email) === lower(body.email),
      );
      if (!account || body.password !== (account.password ?? "password"))
        fail(401, "Invalid email or password.");
      active(account);
      return ok({
        token: tokenFor(account),
        expiresAt: new Date(
          (Math.floor(now() / 1000) + 3600) * 1000,
        ).toISOString(),
        userId: account.id,
        ...pick(account, ["nickname", "firstName", "lastName"]),
      });
    }
    if (route === "api/auth/me" && method === "GET") {
      active(auth());
      return ok({
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        avatarUrl: user.avatarUrl ?? "",
        clubs: memberships(user).map((membership) => {
          const { clubId, ...club } = clubDetail(clubById(membership.clubId));
          return { id: clubId, ...club, role: membership.role };
        }),
      });
    }
    if (route === "api/auth/password" && method === "POST") {
      active(auth());
      validate(body, {
        currentPassword: textRule("Current password", Infinity),
        newPassword: passwordRule,
      });
      if (body.currentPassword !== (user.password ?? "password"))
        fail(400, "Current password is incorrect.");
      Object.assign(user, {
        password: body.newPassword,
        updatedAt: timestamp(),
      });
      return empty();
    }
    if (route === "api/auth/forgot-password" && method === "POST") {
      validate(body, { email: emailRule });
      const account = db.users.find(
        (item) =>
          lower(item.email) === lower(body.email) && item.status === "Active",
      );
      if (account) {
        db.passwordResetTokens = db.passwordResetTokens.filter(
          (item) => item.userId !== account.id,
        );
        db.passwordResetTokens.push({
          userId: account.id,
          token: crypto.randomUUID(),
          expiresAt: now() + 15 * 60_000,
        });
      }
      return ok("If the account exists, a reset token has been generated.");
    }
    if (route === "api/auth/reset-password" && method === "POST") {
      validate(body, {
        tokenFromEmail: textRule("Token", Infinity),
        newPassword: passwordRule,
      });
      const reset = db.passwordResetTokens.find(
        (item) =>
          item.token === clean(body.tokenFromEmail) && item.expiresAt > now(),
      );
      if (!reset) fail(400, "Reset token is invalid or expired.");
      const account = active(userById(reset.userId));
      Object.assign(account, {
        password: body.newPassword,
        updatedAt: timestamp(),
      });
      db.passwordResetTokens = db.passwordResetTokens.filter(
        (item) => item.userId !== account.id,
      );
      return empty();
    }
    if (route === "api/users" && method === "POST") {
      validateUser(body, true);
      for (const key of ["email", "nickname", "phone"])
        if (db.users.some((item) => lower(item[key]) === lower(body[key])))
          fail(409, `A user with this ${key} already exists.`);
      const account = {
        id: nextId(db.users),
        ...Object.fromEntries(
          ["nickname", "firstName", "lastName", "phone"].map((key) => [
            key,
            clean(body[key]),
          ]),
        ),
        email: lower(body.email),
        birthday: body.birthday,
        gender: GENDERS[body.gender],
        password: body.password,
        avatarUrl: null,
        status: "Active",
        roles: ["Player"],
        adminNote: null,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        deletedAt: null,
      };
      db.users.push(account);
      return ok(
        {
          userId: account.id,
          token: tokenFor(account),
          message: "User account created successfully.",
        },
        201,
      );
    }
    if (route === "api/users" && method === "GET") {
      role("AppAdmin");
      const status = query.has("status")
        ? USER_STATUSES[enumValue(query.get("status"), USER_STATUSES, "status")]
        : null;
      const result = page(
        db.users
          .filter((item) => !status || item.status === status)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((item) =>
            pick(item, ["id", "nickname", "email", "status", "createdAt"]),
          ),
        query,
        50,
        true,
      );
      return ok(pick(result, ["items", "totalCount", "page", "pageSize"]));
    }
    if (route === "api/users/search" && method === "GET") {
      auth();
      const search = lower(query.get("q"));
      if (search.length < 2)
        fail(400, "Search query must be at least 2 characters.");
      return ok(
        db.users
          .filter(
            (item) =>
              item.status === "Active" &&
              [item.nickname, item.firstName, item.lastName].some((value) =>
                lower(value).includes(search),
              ),
          )
          .slice(0, 20)
          .map(publicUser),
      );
    }
    if (route === "api/users/me" && method === "DELETE") {
      auth();
      Object.assign(user, {
        status: "Deleted",
        deletedAt: timestamp(),
        updatedAt: timestamp(),
      });
      return empty();
    }
    if (parts[0] === "api" && parts[1] === "users" && /^\d+$/.test(parts[2])) {
      auth();
      const target = userById(parts[2]);
      const isAdmin = [claims.role ?? []].flat().includes("AppAdmin");
      if (parts.length === 3 && method === "GET") {
        if (
          (target.status === "Deleted" && !isAdmin) ||
          (target.id !== user.id && !isAdmin && target.status !== "Active")
        )
          fail(404, "User not found.");
        return ok(
          target.id === user.id || isAdmin
            ? detailUser(target)
            : publicUser(target),
        );
      }
      if (parts.length === 4 && parts[3] === "clubs" && method === "GET") {
        if (target.id !== user.id && !isAdmin)
          fail(403, "You can only view your own managed clubs.");
        return ok(
          memberships(target).map((item) => ({
            id: item.clubId,
            name: clubById(item.clubId).name,
            role: item.role,
          })),
        );
      }
      if (parts.length === 3 && method === "PATCH") {
        if (target.id !== user.id)
          fail(403, "You can only update your own profile.");
        active(user);
        validateUser(body, false);
        for (const key of ["nickname", "phone"])
          if (
            clean(body[key]) &&
            db.users.some(
              (item) =>
                item.id !== target.id && lower(item[key]) === lower(body[key]),
            )
          )
            fail(409, `A user with this ${key} already exists.`);
        for (const key of ["nickname", "firstName", "lastName", "phone"])
          if (clean(body[key])) target[key] = clean(body[key]);
        if (body.birthday != null) target.birthday = body.birthday;
        if (body.gender != null) target.gender = GENDERS[body.gender];
        if (body.avatarUrl != null)
          target.avatarUrl = clean(body.avatarUrl) || null;
        target.updatedAt = timestamp();
        return ok(detailUser(target));
      }
      if (parts.length === 4 && parts[3] === "status" && method === "PATCH") {
        role("AppAdmin");
        validate(body, { reason: textRule("Reason", 500, true) });
        target.status =
          USER_STATUSES[enumValue(body.status, USER_STATUSES, "status")];
        Object.assign(target, {
          adminNote: clean(body.reason) || null,
          updatedAt: timestamp(),
          deletedAt: target.status === "Deleted" ? timestamp() : null,
        });
        return ok(detailUser(target));
      }
    }

    if (route === "api/boardgames/categories" && method === "GET")
      return ok(
        [...db.categories]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((item) => pick(item, ["id", "name"])),
      );
    if (route === "api/boardgames" && method === "GET") {
      const search = lower(query.get("search"));
      const category = query.has("categoryId")
        ? integer(query.get("categoryId"), "categoryId")
        : null;
      const players = query.has("players")
        ? integer(query.get("players"), "players")
        : null;
      const sortBy = lower(query.get("sortBy")) || "rank";
      const direction = lower(query.get("sortDirection")) || "asc";
      if (
        !["rank", "title"].includes(sortBy) ||
        !["asc", "desc"].includes(direction)
      )
        fail(400, "Invalid sortBy or sortDirection.");
      const sign = direction === "desc" ? -1 : 1;
      const games = db.games.filter(
        (game) =>
          (!search || lower(game.title).includes(search)) &&
          (!category || game.categoryIds.includes(category)) &&
          (!players ||
            (game.minPlayers <= players && game.maxPlayers >= players)),
      );
      games.sort((a, b) =>
        sortBy === "title"
          ? a.title.localeCompare(b.title) * sign
          : (a.bggOverallRank == null) - (b.bggOverallRank == null) ||
            ((a.bggOverallRank ?? 0) - (b.bggOverallRank ?? 0)) * sign ||
            a.title.localeCompare(b.title),
      );
      return ok(page(games.map(boardGame), query, 50));
    }
    if (
      route === "api/boardgames/bgg-search" &&
      ["GET", "POST"].includes(method)
    ) {
      role("ClubAdmin");
      if (method === "POST") {
        const keyword = lower(body.keyword);
        if (keyword.length < 3)
          fail(400, "Keyword must contain at least 3 characters.");
        return ok(
          db.bggCatalog
            .filter((game) => lower(game.title).includes(keyword))
            .map((game) => pick(game, ["bggId", "title", "year"])),
        );
      }
      const bggId = integer(query.get("bggid"), "bggid");
      const game = required(
        db.bggCatalog.find((game) => game.bggId === bggId),
        "Board game not found in the offline BGG fixtures.",
      );
      const dto = boardGame(game);
      delete dto.boardGameId;
      return ok({
        ...dto,
        bggId,
        categories: dto.categories.map((category) => category.name),
      });
    }
    if (
      ["api/boardgames/import/hot", "api/boardgames/seed-from-csv"].includes(
        route,
      ) &&
      method === "POST"
    ) {
      role("AppAdmin");
      const offset = route.endsWith("hot")
        ? 0
        : integer(query.get("offset") ?? 0, "offset", 0);
      const count = route.endsWith("hot")
        ? 50
        : integer(query.get("count") ?? 100, "count");
      const games = db.bggCatalog.slice(offset, offset + count);
      if (!games.length)
        fail(
          400,
          "No IDs found in the requested range or end of file reached.",
        );
      let insertedCount = 0;
      for (const game of games) {
        const existing = db.games.find((item) => item.bggId === game.bggId);
        if (existing)
          Object.assign(existing, structuredClone(game), {
            id: existing.id,
            updatedAt: timestamp(),
          });
        else {
          db.games.push({
            ...structuredClone(game),
            id: nextId(db.games),
            createdAt: timestamp(),
            updatedAt: timestamp(),
          });
          insertedCount++;
        }
      }
      return ok({
        requestedCount: games.length,
        processedCount: games.length,
        insertedCount,
        updatedCount: games.length - insertedCount,
      });
    }
    if (
      parts.length === 3 &&
      parts[0] === "api" &&
      parts[1] === "boardgames" &&
      /^\d+$/.test(parts[2]) &&
      method === "GET"
    ) {
      const id = integer(parts[2], "id");
      return ok(
        boardGame(
          required(
            db.games.find((game) => game.id === id),
            "Board game not found.",
          ),
        ),
      );
    }

    if (route === "api/clubs" && method === "GET") {
      if (query.has("status")) role("AppAdmin");
      const status = query.has("status")
        ? CLUB_STATUSES[enumValue(query.get("status"), CLUB_STATUSES, "status")]
        : "Active";
      return ok(
        page(
          db.clubs
            .filter((club) => club.status === status)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(clubList),
          query,
        ),
      );
    }
    if (route === "api/clubs/my" && method === "GET") {
      active(auth());
      return ok(
        page(
          memberships(user)
            .map((item) => ({
              ...clubList(clubById(item.clubId)),
              role: item.role,
              createdAt: clubById(item.clubId).createdAt,
            }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(({ createdAt, ...item }) => item),
          query,
        ),
      );
    }
    if (route === "api/clubs" && method === "POST") {
      active(auth());
      const details = validateClub(body);
      const club = {
        id: nextId(db.clubs),
        ...details,
        status: "Pending",
        adminNote: null,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        deletedAt: null,
      };
      db.clubs.push(club);
      db.userClubs.push({
        id: nextId(db.userClubs),
        clubId: club.id,
        userId: user.id,
        role: "Admin",
      });
      return ok(
        {
          clubId: club.id,
          name: club.name,
          description: club.description ?? "",
          status: club.status,
          createdAt: club.createdAt,
          clubAdminId: user.id,
        },
        201,
      );
    }
    if (parts[0] === "api" && parts[1] === "clubs" && /^\d+$/.test(parts[2])) {
      const club = clubById(parts[2]);
      if (parts.length === 3 && method === "GET") {
        if (club.status !== "Active") fail(404, "Club not found.");
        return ok(clubDetail(club));
      }
      if (parts.length === 4 && parts[3] === "my" && method === "GET") {
        active(auth());
        if (!isClubAdmin(user, club.id)) fail(404, "Club not found.");
        return ok({ ...clubDetail(club), status: club.status });
      }
      if (parts.length === 3 && method === "PUT") {
        manageClub(auth(), club.id);
        Object.assign(club, validateClub(body, club.id), {
          updatedAt: timestamp(),
        });
        return ok({
          clubId: club.id,
          name: club.name,
          description: club.description ?? "",
          status: club.status,
          updatedAt: club.updatedAt,
        });
      }
      if (parts.length === 4 && parts[3] === "status" && method === "PATCH") {
        active(role("AppAdmin"));
        validate(body, { reason: textRule("Reason", 500, true) });
        const status =
          CLUB_STATUSES[enumValue(body.status, CLUB_STATUSES, "status")];
        const transitions = {
          Pending: ["Active", "Rejected"],
          Active: ["Suspended", "Deleted"],
          Suspended: ["Active"],
        };
        if (!transitions[club.status]?.includes(status))
          fail(
            400,
            `Cannot change club status from '${club.status}' to '${status}'.`,
          );
        const previousStatus = club.status;
        Object.assign(club, {
          status,
          adminNote: clean(body.reason) || null,
          updatedAt: timestamp(),
          deletedAt: status === "Deleted" ? timestamp() : null,
        });
        return ok({
          clubId: club.id,
          previousStatus,
          status,
          adminNote: club.adminNote ?? "",
          updatedAt: club.updatedAt,
          deletedAt: club.deletedAt,
        });
      }
      if (parts.length === 4 && parts[3] === "boardgames" && method === "GET") {
        if (club.status !== "Active") fail(404, "Club not found.");
        const ids = db.clubGames
          .filter((item) => item.clubId === club.id && !item.deletedAt)
          .map((item) => item.gameId);
        const search = lower(query.get("search"));
        return ok(
          page(
            db.games
              .filter(
                (game) =>
                  ids.includes(game.id) &&
                  (!search || lower(game.title).includes(search)),
              )
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(boardGame),
            query,
          ),
        );
      }
      if (
        parts.length === 4 &&
        parts[3] === "boardgames" &&
        method === "POST"
      ) {
        manageClub(auth(), club.id);
        const bggId = integer(body.bggGameId, "bggGameId");
        let game = db.games.find((game) => game.bggId === bggId);
        if (!game) {
          const fixture = db.bggCatalog.find((game) => game.bggId === bggId);
          if (!fixture)
            fail(400, "Board game not found in the offline BGG fixtures.");
          game = { ...structuredClone(fixture), id: nextId(db.games) };
          db.games.push(game);
        }
        if (
          db.clubGames.some(
            (item) =>
              item.clubId === club.id &&
              item.gameId === game.id &&
              !item.deletedAt,
          )
        )
          fail(409, "Board game is already in this club inventory.");
        const existing = db.clubGames.find(
          (item) => item.clubId === club.id && item.gameId === game.id,
        );
        if (existing) existing.deletedAt = null;
        else
          db.clubGames.push({
            id: nextId(db.clubGames),
            clubId: club.id,
            gameId: game.id,
            deletedAt: null,
          });
        return ok({
          clubId: club.id,
          boardGameId: game.id,
          bggId: game.bggId,
          title: game.title,
        });
      }
      if (
        parts.length === 5 &&
        parts[3] === "boardgames" &&
        method === "DELETE"
      ) {
        manageClub(auth(), club.id);
        const inventory = required(
          db.clubGames.find(
            (item) =>
              item.clubId === club.id &&
              item.gameId === Number(parts[4]) &&
              !item.deletedAt,
          ),
          "Board game is not in this club inventory.",
        );
        inventory.deletedAt = timestamp();
        return empty();
      }
      if (
        parts.length === 4 &&
        parts[3] === "tournaments" &&
        method === "GET"
      ) {
        manageClub(auth(), club.id);
        const status = query.has("status")
          ? enumValue(query.get("status"), TOURNAMENT_STATUSES, "status")
          : null;
        return ok(
          page(
            db.tournaments
              .filter(
                (item) =>
                  item.clubId === club.id &&
                  (status == null || item.status === status),
              )
              .sort(
                (a, b) => b.startsAt.localeCompare(a.startsAt) || b.id - a.id,
              )
              .map(tournamentList),
            query,
            20,
          ),
        );
      }
      // Frontend-only fixtures: these endpoints have no corresponding controller yet.
      if (parts.length === 4 && parts[3] === "staff" && method === "GET") {
        manageClub(auth(), club.id);
        return ok(
          db.userClubs
            .filter((item) => item.clubId === club.id)
            .map((item) => ({
              ...pick(publicUser(userById(item.userId)), [
                "id",
                "nickname",
                "email",
                "avatarUrl",
              ]),
              role: item.role,
            })),
        );
      }
      if (parts.length === 4 && parts[3] === "leaderboards" && method === "GET")
        return ok(
          db.clubLeaderboards.filter(
            (item) =>
              item.clubId === club.id &&
              (!query.has("gameId") ||
                item.gameId === Number(query.get("gameId"))) &&
              (!query.has("season") || item.season === query.get("season")),
          ),
        );
    }

    if (route === "api/tournaments" && method === "GET") {
      const type = query.has("type")
        ? enumValue(query.get("type"), TOURNAMENT_TYPES, "type")
        : null;
      const clubId = query.has("clubId")
        ? integer(query.get("clubId"), "clubId")
        : null;
      const boardGameId = query.has("boardGameId")
        ? integer(query.get("boardGameId"), "boardGameId")
        : null;
      for (const key of ["startsAfter", "startsBefore"])
        if (query.has(key) && !Number.isFinite(Date.parse(query.get(key))))
          fail(400, `${key} is invalid.`);
      const items = db.tournaments.filter(
        (item) =>
          ![0, 6].includes(item.status) &&
          (type == null || item.tournamentType === type) &&
          (!clubId || item.clubId === clubId) &&
          (!boardGameId || item.boardGameIds.includes(boardGameId)) &&
          lower(item.name).includes(lower(query.get("search"))) &&
          lower(item.location).includes(lower(query.get("location"))) &&
          (!query.has("startsAfter") ||
            Date.parse(item.startsAt) >=
              Date.parse(query.get("startsAfter"))) &&
          (!query.has("startsBefore") ||
            Date.parse(item.startsAt) <= Date.parse(query.get("startsBefore"))),
      );
      const sortBy =
        { name: "name", location: "location" }[lower(query.get("sortBy"))] ??
        "startsAt";
      const direction = lower(query.get("sortDirection")) === "desc" ? -1 : 1;
      items.sort(
        (a, b) =>
          (sortBy === "startsAt"
            ? Date.parse(a.startsAt) - Date.parse(b.startsAt)
            : a[sortBy].localeCompare(b[sortBy])) * direction || a.id - b.id,
      );
      return ok(page(items.map(tournamentList), query, 20));
    }
    if (route === "api/tournaments/my-registrations" && method === "GET") {
      auth();
      return ok(
        page(
          db.tournamentRegistrations
            .filter((item) => item.userId === user.id && item.status !== 2)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((item) => {
              const tournament = tournamentById(item.tournamentId);
              return {
                ...registrationSummary(item),
                tournamentId: tournament.id,
                tournamentName: tournament.name,
                clubId: tournament.clubId,
                clubName: clubById(tournament.clubId).name,
                tournamentStartsAt: tournament.startsAt,
                tournamentEndsAt: tournament.endsAt,
                location: tournament.location,
                entryFee: tournament.entryFee,
              };
            }),
          query,
          20,
        ),
      );
    }
    if (route === "api/tournaments" && method === "POST") {
      const club = manageClub(auth(), integer(body.clubId, "clubId"));
      const input = tournamentInput(body, club.id);
      const item = {
        id: nextId(db.tournaments),
        clubId: club.id,
        ...input,
        status: 0,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        createdByUserId: user.id,
      };
      db.tournaments.push(item);
      return ok(tournamentCreated(item), 201);
    }
    if (
      parts[0] === "api" &&
      parts[1] === "tournaments" &&
      /^\d+$/.test(parts[2])
    ) {
      const tournament = tournamentById(parts[2]);
      if (parts.length === 3 && method === "GET") {
        if (
          [0, 6].includes(tournament.status) &&
          !isClubAdmin(user, tournament.clubId)
        )
          fail(404, "Tournament not found.");
        return ok(tournamentDetail(tournament, user));
      }
      if (parts.length === 3 && method === "PUT") {
        manageClub(auth(), tournament.clubId);
        if (![0, 1, 2, 3].includes(tournament.status))
          fail(403, "Tournament cannot be edited in its current status.");
        const input = tournamentInput(
          body,
          tournament.clubId,
          tournament.status === 0,
        );
        if (tournament.status === 0) Object.assign(tournament, input);
        else if (tournament.status === 3)
          Object.assign(tournament, pick(input, ["description", "location"]));
        else {
          if (
            input.tournamentType !== tournament.tournamentType ||
            Date.parse(input.startsAt) !== Date.parse(tournament.startsAt) ||
            input.minParticipants !== tournament.minParticipants ||
            input.maxParticipants !== tournament.maxParticipants
          )
            fail(
              400,
              "Tournament type, start date, and participant limits cannot be changed after publishing.",
            );
          if (
            [...input.boardGameIds].sort().join() !==
            [...tournament.boardGameIds].sort().join()
          )
            fail(400, "Board games cannot be changed after publishing.");
          const updates = {
            ...pick(input, [
              "description",
              "location",
              "registrationClosesAt",
              "cancellationDeadline",
            ]),
            endsAt: input.endsAt ?? tournament.endsAt,
          };
          validateDates({ ...tournament, ...updates });
          Object.assign(tournament, updates);
        }
        tournament.updatedAt = timestamp();
        return empty();
      }
      if (parts.length === 4 && parts[3] === "publish" && method === "POST") {
        manageClub(auth(), tournament.clubId);
        if (tournament.status !== 0)
          fail(400, "Only draft tournaments can be published.");
        validateDates(tournament);
        if (!tournament.boardGameIds.length)
          fail(
            400,
            "At least one board game must be assigned before publishing.",
          );
        if (Date.parse(tournament.registrationOpensAt) <= now())
          fail(
            400,
            "Cannot publish tournament because RegistrationOpensAt is already in the past. Update the registration dates first.",
          );
        Object.assign(tournament, { status: 1, updatedAt: timestamp() });
        return empty();
      }
      if (parts.length === 4 && parts[3] === "cancel" && method === "POST") {
        manageClub(auth(), tournament.clubId);
        if ([5, 6].includes(tournament.status))
          fail(400, "Tournament cannot be cancelled in its current status.");
        Object.assign(tournament, { status: 6, updatedAt: timestamp() });
        registrations(tournament.id).forEach((item) =>
          Object.assign(item, {
            status: 2,
            waitlistPosition: null,
            updatedAt: timestamp(),
          }),
        );
        return empty();
      }
      if (
        parts.length === 4 &&
        parts[3] === "registrations" &&
        method === "GET"
      ) {
        manageClub(auth(), tournament.clubId);
        const status = query.has("status")
          ? enumValue(query.get("status"), REGISTRATION_STATUSES, "status")
          : null;
        return ok(
          page(
            registrations(tournament.id)
              .filter((item) => status == null || item.status === status)
              .sort(
                (a, b) =>
                  a.status - b.status ||
                  (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0) ||
                  a.createdAt.localeCompare(b.createdAt),
              )
              .map((item) => {
                const player = userById(item.userId);
                return {
                  ...registrationSummary(item),
                  user: {
                    id: player.id,
                    displayName:
                      player.nickname ||
                      `${player.firstName} ${player.lastName}`,
                    avatarUrl: player.avatarUrl ?? null,
                  },
                };
              }),
            query,
            20,
          ),
        );
      }
      if (
        parts.length === 4 &&
        parts[3] === "registrations" &&
        method === "POST"
      ) {
        active(auth());
        if (tournament.status !== 2)
          fail(400, "Tournament registration is not open.");
        if (
          now() < Date.parse(tournament.registrationOpensAt) ||
          now() > Date.parse(tournament.registrationClosesAt)
        )
          fail(400, "Registration period is not open.");
        if (now() > Date.parse(tournament.cancellationDeadline))
          fail(400, "Cannot register after the cancellation deadline.");
        let registration = registrations(tournament.id).find(
          (item) => item.userId === user.id,
        );
        if (registration && registration.status !== 2)
          fail(
            409,
            "You already have an active registration for this tournament.",
          );
        const waitlisted =
          acceptedCount(tournament.id) >= tournament.maxParticipants;
        const values = {
          status: waitlisted ? 1 : 0,
          waitlistPosition: waitlisted
            ? Math.max(
                0,
                ...registrations(tournament.id)
                  .filter((item) => item.status === 1)
                  .map((item) => item.waitlistPosition),
              ) + 1
            : null,
          createdAt: timestamp(),
          updatedAt: timestamp(),
        };
        if (registration) Object.assign(registration, values);
        else {
          registration = {
            id: nextId(db.tournamentRegistrations),
            tournamentId: tournament.id,
            userId: user.id,
            ...values,
          };
          db.tournamentRegistrations.push(registration);
        }
        return ok(
          pick(registration, [
            "id",
            "tournamentId",
            "userId",
            "status",
            "waitlistPosition",
            "createdAt",
          ]),
        );
      }
      if (
        parts.length === 5 &&
        parts[3] === "registrations" &&
        parts[4] === "me" &&
        method === "DELETE"
      ) {
        auth();
        if (tournament.status === 6)
          fail(
            400,
            "Cannot cancel registration after the tournament was cancelled.",
          );
        if (now() > Date.parse(tournament.cancellationDeadline))
          fail(
            400,
            "Cannot cancel registration after the cancellation deadline.",
          );
        const registration = required(
          registrations(tournament.id).find((item) => item.userId === user.id),
          "Registration was not found.",
        );
        if (registration.status === 2)
          fail(400, "Registration is already cancelled.");
        const wasAccepted = registration.status === 0;
        Object.assign(registration, {
          status: 2,
          waitlistPosition: null,
          updatedAt: timestamp(),
        });
        if (wasAccepted) {
          const promoted = registrations(tournament.id)
            .filter((item) => item.status === 1)
            .sort(
              (a, b) =>
                a.waitlistPosition - b.waitlistPosition ||
                a.createdAt.localeCompare(b.createdAt),
            )[0];
          if (promoted)
            Object.assign(promoted, {
              status: 0,
              waitlistPosition: null,
              updatedAt: timestamp(),
            });
          renumber(tournament.id);
        }
        return empty();
      }
    }
    // Leaderboards remain fixture-backed until the backend implements them.
    if (route === "api/leaderboards" && method === "GET")
      return ok(
        db.platformLeaderboards.filter(
          (item) =>
            (!query.has("gameId") ||
              item.gameId === Number(query.get("gameId"))) &&
            (!query.has("season") || item.season === query.get("season")),
        ),
      );
    if (route === "api/notifications" && method === "GET") {
      auth();
      return ok(db.notifications.filter((item) => item.userId === user.id));
    }
    fail(404, `Mock route ${method} ${url.pathname} is not implemented.`);
  }

  return {
    snapshot: () => structuredClone(db),
    restore: (state) => {
      db = structuredClone(state);
    },
    request(path, options = {}) {
      lifecycle();
      const before = structuredClone(db);
      try {
        return structuredClone(dispatch(path, options));
      } catch (error) {
        db = before;
        if (!(error instanceof MockError)) throw error;
        return {
          status: error.status,
          body: {
            title:
              {
                400: "Bad Request",
                401: "Unauthorized",
                403: "Forbidden",
                404: "Not Found",
                409: "Conflict",
              }[error.status] ?? "Request failed",
            status: error.status,
            detail: error.message,
            ...(error.errors ? { errors: error.errors } : {}),
          },
        };
      }
    },
  };
}
