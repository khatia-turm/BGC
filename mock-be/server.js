import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 5051);
// Seed data is loaded at process start; restart the mock process after manual seed edits.
const dataFile = fileURLToPath(new URL("./mock-data.json", import.meta.url));
let db = JSON.parse(await readFile(dataFile, "utf8"));
db.notifications ??= [];

app.use(express.json());
app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const save = () => writeFile(dataFile, `${JSON.stringify(db, null, 2)}\n`);
const problem = (res, status, detail) =>
  res
    .status(status)
    .type("application/problem+json")
    .json({
      title: status === 404 ? "Not Found" : "Request failed",
      status,
      detail,
    });
const tokenFor = (user) => {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({ UserId: String(user.id), email: user.email, unique_name: user.nickname, role: "Player", exp: Math.floor(Date.now() / 1000) + 3600 })}.mock`;
};
const currentUser = (req) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url"));
    return db.users.find((user) => user.id === Number(payload.UserId));
  } catch {
    return undefined;
  }
};
const requireUser = (req, res, next) => {
  req.user = currentUser(req);
  if (!req.user) return problem(res, 401, "A valid Bearer token is required.");
  next();
};
const publicUser = (user) => ({
  id: user.id,
  nickname: user.nickname,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl ?? "",
});
const detailUser = (user) => ({
  ...publicUser(user),
  birthday: user.birthday,
  gender: user.gender,
  phone: user.phone,
  status: user.status,
  updatedAt: user.updatedAt,
});

// Auth + Users: mirrors FRONTEND_API_HANDOFF.md.
app.post("/api/auth/login", (req, res) => {
  const user = db.users.find(
    (item) =>
      item.email.toLowerCase() === String(req.body.email).trim().toLowerCase(),
  );
  if (!user) return problem(res, 401, "Invalid email or password.");
  if (user.status !== "Active") return problem(res, 403, "User is not active.");
  const expiresAt = new Date(Date.now() + 3600_000).toISOString();
  res.json({
    token: tokenFor(user),
    userId: user.id,
    nickname: user.nickname,
    firstName: user.firstName,
    lastName: user.lastName,
    expiresAt,
  });
});
app.get("/api/auth/me", requireUser, (req, res) =>
  res.json({
    id: req.user.id,
    nickname: req.user.nickname,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl ?? "",
    clubs: db.userClubs
      .filter((membership) => membership.userId === req.user.id)
      .map((membership) => ({
        ...db.clubs.find((club) => club.id === membership.clubId),
        role: membership.role,
      })),
  }),
);
app.post("/api/auth/password", requireUser, (_req, res) => res.sendStatus(204));
app.post("/api/auth/forgot-password", (_req, res) =>
  res.json("If the account exists, a reset token has been generated."),
);
app.post("/api/auth/reset-password", (_req, res) => res.sendStatus(204));

app.post("/api/users", async (req, res) => {
  const body = req.body;
  const duplicate = db.users.some(
    (user) =>
      user.email.toLowerCase() === String(body.email).toLowerCase() ||
      user.nickname.toLowerCase() === String(body.nickname).toLowerCase() ||
      user.phone === body.phone,
  );
  if (duplicate)
    return problem(
      res,
      409,
      "Email, nickname, or phone is already registered.",
    );
  const user = {
    id: Math.max(0, ...db.users.map((item) => item.id)) + 1,
    nickname: body.nickname,
    firstName: body.firstName,
    lastName: body.lastName,
    email: String(body.email).trim().toLowerCase(),
    phone: body.phone,
    birthday: body.birthday,
    gender: ["Male", "Female", "Other"][body.gender],
    avatarUrl: null,
    status: "Active",
    adminNote: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
  db.users.push(user);
  await save();
  res.status(201).json({
    userId: user.id,
    token: tokenFor(user),
    message: "User account created successfully.",
  });
});
app.get("/api/users/search", requireUser, (req, res) => {
  const q = String(req.query.q ?? "")
    .trim()
    .toLowerCase();
  if (q.length < 2)
    return problem(res, 400, "Search requires at least 2 characters.");
  res.json(
    db.users
      .filter(
        (user) =>
          user.status === "Active" &&
          [user.nickname, user.firstName, user.lastName].some((value) =>
            value.toLowerCase().includes(q),
          ),
      )
      .slice(0, 20)
      .map(publicUser),
  );
});
app.get("/api/users", requireUser, (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));
  const users = db.users.filter(
    (user) => !req.query.status || user.status === req.query.status,
  );
  res.json({
    items: users
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ id, nickname, email, status, createdAt }) => ({
        id,
        nickname,
        email,
        status,
        createdAt,
      })),
    totalCount: users.length,
    page,
    pageSize,
  });
});
app.delete("/api/users/me", requireUser, async (req, res) => {
  req.user.status = "Deleted";
  req.user.deletedAt = new Date().toISOString();
  await save();
  res.sendStatus(204);
});
app.get("/api/users/:id/clubs", requireUser, (req, res) =>
  res.json(
    db.userClubs
      .filter((item) => item.userId === Number(req.params.id))
      .map((item) => ({
        id: item.clubId,
        name: db.clubs.find((club) => club.id === item.clubId)?.name,
        role: item.role,
      })),
  ),
);
app.patch("/api/users/:id/status", requireUser, async (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id));
  if (!user) return problem(res, 404, "User not found.");
  user.status = req.body.status;
  user.adminNote = req.body.reason ?? null;
  user.updatedAt = new Date().toISOString();
  await save();
  res.json(detailUser(user));
});
app.get("/api/users/:id", requireUser, (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id));
  if (!user) return problem(res, 404, "User not found.");
  res.json(req.user.id === user.id ? detailUser(user) : publicUser(user));
});
app.patch("/api/users/:id", requireUser, async (req, res) => {
  if (req.user.id !== Number(req.params.id))
    return problem(res, 403, "You can only update your own profile.");
  Object.assign(req.user, req.body, { updatedAt: new Date().toISOString() });
  await save();
  res.json(detailUser(req.user));
});

// Read-only catalog routes used by the current client.
app.get("/api/games/categories", (_req, res) => res.json(db.categories));
app.get("/api/games", (req, res) =>
  res.json(
    db.games
      .filter(
        (game) =>
          !req.query.search ||
          game.title
            .toLowerCase()
            .includes(String(req.query.search).toLowerCase()),
      )
      .filter(
        (game) =>
          !req.query.categoryId ||
          game.categoryIds.includes(Number(req.query.categoryId)),
      ),
  ),
);
app.get("/api/games/:id", (req, res) =>
  res.json(db.games.find((item) => item.id === Number(req.params.id))),
);
app.get("/api/clubs", (req, res) =>
  res.json(
    db.clubs.filter(
      (club) => !req.query.status || club.status === req.query.status,
    ),
  ),
);
app.get("/api/clubs/my-request", requireUser, (req, res) => {
  const club = db.clubs
    .filter((item) => item.ownerId === req.user.id && ["Pending", "Rejected"].includes(item.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  res.json(club ? { clubId: club.id, clubName: club.name, status: club.status, submittedAt: club.createdAt, adminNote: club.adminNote } : null);
});
app.post("/api/clubs", requireUser, async (req, res) => {
  const body = req.body;
  if (!body.name || !body.address || !body.city || !body.email || !body.phone)
    return problem(res, 400, "Name, address, city, email, and phone are required.");
  const duplicate = db.clubs.some((club) =>
    club.name.toLowerCase() === String(body.name).trim().toLowerCase() ||
    (club.email && club.email.toLowerCase() === String(body.email).trim().toLowerCase()),
  );
  if (duplicate) return problem(res, 409, "A club with this name or email already exists.");
  if (db.clubs.some((club) => club.ownerId === req.user.id && club.status === "Pending"))
    return problem(res, 409, "You already have a club application waiting for approval.");
  const now = new Date().toISOString();
  const club = { id: Math.max(0, ...db.clubs.map((item) => item.id)) + 1, name: String(body.name).trim(), logoUrl: body.logoUrl ?? "", description: body.description ?? null, address: body.address, city: body.city, email: body.email, phone: body.phone, workingHours: body.workingHours ?? null, status: "Pending", adminNote: null, ownerId: req.user.id, createdAt: now, updatedAt: now, deletedAt: null };
  db.clubs.push(club);
  await save();
  res.status(201).json({ clubId: club.id, status: "Pending", message: "Club application submitted successfully and is awaiting admin approval." });
});
app.get("/api/clubs/:id", (req, res) =>
  res.json(db.clubs.find((item) => item.id === Number(req.params.id))),
);
app.get("/api/clubs/:id/games", (req, res) => {
  const ids = db.clubGames
    .filter((item) => item.clubId === Number(req.params.id) && !item.deletedAt)
    .map((item) => item.gameId);
  res.json(db.games.filter((game) => ids.includes(game.id)));
});
app.get("/api/clubs/:id/dashboard", (req, res) =>
  res.json({
    clubId:Number(req.params.id),
    pendingMembers:db.tournamentRegistrations.filter((item)=>db.tournaments.some((t)=>t.id===item.tournamentId&&t.clubId===Number(req.params.id))&&item.status==="Pending").length,
    upcomingTournaments:db.tournaments.filter((item)=>item.clubId===Number(req.params.id)&&new Date(item.startsAt)>new Date()).length,
    totalPlayers:new Set(db.tournamentRegistrations.filter((item)=>db.tournaments.some((t)=>t.id===item.tournamentId&&t.clubId===Number(req.params.id))).map((item)=>item.userId)).size,
  }),
);
app.get("/api/clubs/:id/staff", requireUser, (req,res)=>{
  const memberships=db.userClubs.filter((item)=>item.clubId===Number(req.params.id));
  res.json(memberships.map((item)=>{const user=db.users.find((candidate)=>candidate.id===item.userId);return {id:user.id,nickname:user.nickname,email:user.email,avatarUrl:user.avatarUrl??"",role:item.role};}));
});
app.get("/api/clubs/:id/registration-requests", requireUser, (req,res)=>{
  const clubId=Number(req.params.id);
  const tournamentIds=db.tournaments.filter((item)=>item.clubId===clubId).map((item)=>item.id);
  res.json(db.tournamentRegistrations.filter((item)=>tournamentIds.includes(item.tournamentId)&&item.status==="Pending").map((item)=>{const user=db.users.find((candidate)=>candidate.id===item.userId);const tournament=db.tournaments.find((candidate)=>candidate.id===item.tournamentId);const game=db.games.find((candidate)=>candidate.id===tournament.gameId);const rating=db.platformLeaderboards.find((entry)=>entry.userId===user.id&&entry.gameId===game.id)?.ratingPoints??null;return {id:item.id,tournamentId:tournament.id,tournamentName:tournament.name,gameTitle:game.title,userId:user.id,nickname:user.nickname,avatarUrl:user.avatarUrl??null,rating,registeredAt:item.registeredAt,status:item.status};}));
});
app.patch("/api/tournament-registrations/:id/status",requireUser,async(req,res)=>{
  const registration=db.tournamentRegistrations.find((item)=>item.id===Number(req.params.id));
  if(!registration)return problem(res,404,"Registration request not found.");
  const tournament=db.tournaments.find((item)=>item.id===registration.tournamentId);
  const membership=db.userClubs.find((item)=>item.clubId===tournament.clubId&&item.userId===req.user.id);
  if(!membership)return problem(res,403,"Club staff access is required.");
  if(registration.status==="Pending"&&req.body.status==="Accepted")tournament.registeredPlayers+=1;
  registration.status=req.body.status;await save();res.json(registration);
});
app.patch("/api/clubs/:id", requireUser, async (req,res)=>{
  const club=db.clubs.find((item)=>item.id===Number(req.params.id));
  const membership=db.userClubs.find((item)=>item.clubId===club?.id&&item.userId===req.user.id&&item.role==="Admin");
  if(!club)return problem(res,404,"Club not found.");
  if(!membership)return problem(res,403,"Club administrator access is required.");
  Object.assign(club,req.body,{updatedAt:new Date().toISOString()});await save();res.json(club);
});
app.get("/api/clubs/:id/leaderboards", (req, res) =>
  res.json(
    db.clubLeaderboards.filter(
      (item) =>
        item.clubId === Number(req.params.id) &&
        (!req.query.gameId || item.gameId === Number(req.query.gameId)) &&
        (!req.query.season || item.season === req.query.season),
    ),
  ),
);
app.get("/api/leaderboards", (req, res) =>
  res.json(
    db.platformLeaderboards.filter(
      (item) =>
        (!req.query.gameId || item.gameId === Number(req.query.gameId)) &&
        (!req.query.season || item.season === req.query.season),
    ),
  ),
);

const registrationResponse = (registration, tournament) => ({
  id: registration.id,
  tournamentId: registration.tournamentId,
  status: registration.status === "Waitlisted" ? "Waitlisted" : "Accepted",
  registeredAt: registration.registeredAt,
  cancellationClosesAt: tournament.registrationClosesAt,
});
const tournamentResponse = (tournament) => ({
  ...tournament,
  waitlistCount: db.tournamentRegistrations.filter(
    (item) =>
      item.tournamentId === tournament.id && item.status === "Waitlisted",
  ).length,
});
app.get("/api/tournaments", (_req, res) =>
  res.json(db.tournaments.map(tournamentResponse)),
);
app.get("/api/tournaments/:id", (req, res) =>
  res.json(
    tournamentResponse(
      db.tournaments.find((item) => item.id === Number(req.params.id)),
    ),
  ),
);
app.get("/api/tournaments/:id/participants", (req, res) => {
  const ids = db.tournamentRegistrations
    .filter(
      (item) =>
        item.tournamentId === Number(req.params.id) &&
        item.status !== "Waitlisted",
    )
    .map((item) => item.userId);
  res.json(
    db.users
      .filter((user) => ids.includes(user.id))
      .map(({ id, nickname, avatarUrl }) => ({ id, nickname, avatarUrl })),
  );
});
app.get("/api/tournaments/:id/registration", requireUser, (req, res) => {
  const tournament = db.tournaments.find(
    (item) => item.id === Number(req.params.id),
  );
  const registration = db.tournamentRegistrations.find(
    (item) =>
      item.tournamentId === tournament.id && item.userId === req.user.id,
  );
  res.json(
    registration ? registrationResponse(registration, tournament) : null,
  );
});
app.post("/api/tournaments/:id/registration", requireUser, async (req, res) => {
  if (!req.body.agreementAccepted)
    return problem(res, 400, "Tournament rules must be accepted.");
  const tournament = db.tournaments.find(
    (item) => item.id === Number(req.params.id),
  );
  const status =
    tournament.registeredPlayers >= tournament.maxPlayers
      ? "Waitlisted"
      : "Accepted";
  const registration = {
    id: Math.max(0, ...db.tournamentRegistrations.map((item) => item.id)) + 1,
    tournamentId: tournament.id,
    userId: req.user.id,
    status,
    registeredAt: new Date().toISOString(),
  };
  db.tournamentRegistrations.push(registration);
  if (status === "Accepted") tournament.registeredPlayers++;
  db.notifications.unshift({
    id: `registration-${registration.id}`,
    userId: req.user.id,
    type: status === "Accepted" ? "Registration" : "Waitlist",
    title:
      status === "Accepted" ? "Registration confirmed" : "Added to waitlist",
    message: `${tournament.name}: ${status}.`,
    createdAt: new Date().toISOString(),
    tournamentId: tournament.id,
  });
  await save();
  res.status(201).json(registrationResponse(registration, tournament));
});
app.delete(
  "/api/tournaments/:id/registration",
  requireUser,
  async (req, res) => {
    const index = db.tournamentRegistrations.findIndex(
      (item) =>
        item.tournamentId === Number(req.params.id) &&
        item.userId === req.user.id,
    );
    if (index < 0) return problem(res, 404, "Registration not found.");
    db.tournamentRegistrations.splice(index, 1);
    await save();
    res.sendStatus(204);
  },
);

const publicPlayer = (user) => {
  const rankings = db.platformLeaderboards
    .filter((item) => item.userId === user.id)
    .map(({ gameId, season, rank, ratingPoints }) => ({
      gameId,
      season,
      rank,
      ratingPoints,
    }));
  const tournaments = db.tournamentRegistrations
    .filter((item) => item.userId === user.id)
    .map((registration) => {
      const tournament = db.tournaments.find(
        (item) => item.id === registration.tournamentId,
      );
      return {
        tournamentId: tournament.id,
        name: tournament.name,
        startsAt: tournament.startsAt,
        city: tournament.city,
        status: registration.status,
      };
    });
  return {
    id: user.id,
    nickname: user.nickname,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt,
    stats: {
      ratingPoints: rankings.reduce((sum, item) => sum + item.ratingPoints, 0),
      tournamentsPlayed: tournaments.length,
      wins: 0,
      bestFinish: null,
    },
    rankings,
    tournaments,
  };
};
app.get("/api/players", (req, res) => {
  const search = String(req.query.search ?? "").toLowerCase();
  res.json(
    db.users
      .filter(
        (user) =>
          !search ||
          [user.nickname, user.firstName, user.lastName].some((value) =>
            value.toLowerCase().includes(search),
          ),
      )
      .map((user) => {
        const { id, nickname, firstName, lastName, avatarUrl, createdAt } =
          user;
        return {
          id,
          nickname,
          firstName,
          lastName,
          avatarUrl,
          joinedAt: createdAt,
        };
      }),
  );
});
app.get("/api/players/:id", (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id));
  if (!user) return problem(res, 404, "Player not found.");
  res.json(publicPlayer(user));
});
app.get("/api/notifications", requireUser, (req, res) =>
  res.json(db.notifications.filter((item) => item.userId === req.user.id)),
);

app.use((req, res) =>
  problem(res, 404, `Mock route ${req.method} ${req.path} is not implemented.`),
);
const server = app.listen(port, () =>
  console.log(`MeepleHub mock API listening on http://localhost:${port}`),
);
export { app, server };
