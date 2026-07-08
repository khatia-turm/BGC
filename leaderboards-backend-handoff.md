# Leaderboards Frontend Mock and Backend Handoff

This document describes how leaderboards currently work in the frontend mock and what the backend should expose/store to support the same functionality with real data.

## Current Frontend Behavior

There are two leaderboard surfaces:

1. Platform/global leaderboards page: `/leaderboards`
2. Club-specific leaderboards page: `/clubs/:clubId/leaderboards`

The leaderboard frontend is currently backed by mock data, not real backend API calls.

Important files:

- `src/entities/leaderboard/api/index.ts`
- `src/entities/leaderboard/model/types.ts`
- `src/pages/leaderboards/LeaderboardsPage.tsx`
- `src/pages/clubs/ClubLeaderboardsPage.tsx`
- `src/features/leaderboard/model/useLeaderboardPage.ts`
- `src/entities/leaderboard/ui/LeaderboardPodium.tsx`
- `src/entities/leaderboard/ui/LeaderboardTable.tsx`
- `src/shared/api/mockApi.ts`
- `mock-be/mock-data.json`
- `mock-be/server.js`

Important note: `src/entities/leaderboard/api/index.ts` calls `mockRequest` directly. When backend endpoints are ready, these functions should be switched to `apiClient`, the same way most real API integrations in the app work.

## Platform Leaderboards Page

The public platform leaderboard page uses:

```ts
usePlatformLeaderboard({ gameId, season })
```

Current mock endpoint:

```http
GET /api/leaderboards?gameId=13&season=2026
```

Behavior:

- The page loads board games from `useGames()`.
- If the user has not selected a game yet, the frontend uses the first returned game as the default `gameId`.
- The default `season` is the current calendar year from `new Date().getFullYear()`.
- The frontend only enables the leaderboard query when `gameId` is finite.
- The response is expected to already be sorted by `rank`.
- The top 3 entries are displayed in the podium.
- All entries are displayed in the full ranking table.
- Player names link to `/players/:userId`.

Current frontend type:

```ts
export type PlatformLeaderboardEntry = {
  id: number;
  gameId: number;
  season: string;
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  rank: number;
  ratingPoints: number;
  tournamentsPlayed: number;
  wins: number;
  bestFinish: number;
};
```

Current response shape:

```json
[
  {
    "id": 1,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 214.8,
    "tournamentsPlayed": 8,
    "wins": 5,
    "bestFinish": 1
  }
]
```

Request body: none. This is a `GET`.

## Club Leaderboards Page

The club leaderboard page uses:

```ts
useClubLeaderboard(clubId, { gameId, season })
```

Current mock endpoint:

```http
GET /api/clubs/456/leaderboards?gameId=13&season=2026
```

Behavior:

- The page loads the club with `useClub(id)`.
- The page loads the club's games with `useClubGames(id)`.
- If the user has not selected a game yet, the frontend uses the first returned club game as the default `gameId`.
- The default `season` is the current calendar year.
- The current UI offers hardcoded season options `2026` and `2025`.
- The frontend only enables the query when both `clubId` and `gameId` are finite.
- The response is expected to already be sorted by `rank`.

Current frontend type:

```ts
export type ClubLeaderboardEntry = {
  id: number;
  clubId: number;
  gameId: number;
  season: string;
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  rank: number;
  ratingPoints: number;
  gamesPlayed: number;
  wins: number;
};
```

Current response shape:

```json
[
  {
    "id": 1,
    "clubId": 456,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 128.4,
    "gamesPlayed": 18,
    "wins": 11
  }
]
```

Request body: none. This is a `GET`.

## How Mock Data Is Stored

The mock stores leaderboard entries as precomputed arrays in `mock-be/mock-data.json`.

Platform data:

```json
"platformLeaderboards": [
  {
    "id": 1,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 214.8,
    "tournamentsPlayed": 8,
    "wins": 5,
    "bestFinish": 1
  }
]
```

Club data:

```json
"clubLeaderboards": [
  {
    "id": 1,
    "clubId": 456,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 128.4,
    "gamesPlayed": 18,
    "wins": 11
  }
]
```

The mock filtering logic is simple:

- Platform leaderboard: filter by `gameId` if provided, filter by `season` if provided.
- Club leaderboard: filter by `clubId`, then filter by `gameId` if provided, filter by `season` if provided.
- No sorting is performed in the mock handler. The mock data is already written in rank order.
- No pagination is currently used by the frontend.

## Backend Data Model Recommendation

The backend can support this in two possible ways:

1. Store computed leaderboard snapshots in dedicated tables.
2. Calculate leaderboards dynamically from tournament results.

Recommended approach for this project: store leaderboard snapshots, and recalculate/update them when tournament results are finalized. This keeps reads fast and keeps the frontend endpoint simple.

### Platform Leaderboard Table

Suggested table: `platform_leaderboard_entries`

Suggested columns:

```text
id                 int / uuid primary key
game_id            int not null, foreign key to board_games
season             varchar not null
user_id            int not null, foreign key to users
rank               int not null
rating_points      numeric(10, 2) not null
tournaments_played int not null default 0
wins               int not null default 0
best_finish        int null
created_at         timestamp not null
updated_at         timestamp not null
```

Recommended unique constraints:

```text
unique(game_id, season, user_id)
unique(game_id, season, rank)
```

Recommended indexes:

```text
index(game_id, season, rank)
index(user_id)
```

### Club Leaderboard Table

Suggested table: `club_leaderboard_entries`

Suggested columns:

```text
id            int / uuid primary key
club_id       int not null, foreign key to clubs
game_id       int not null, foreign key to board_games
season        varchar not null
user_id       int not null, foreign key to users
rank          int not null
rating_points numeric(10, 2) not null
games_played  int not null default 0
wins          int not null default 0
created_at    timestamp not null
updated_at    timestamp not null
```

Recommended unique constraints:

```text
unique(club_id, game_id, season, user_id)
unique(club_id, game_id, season, rank)
```

Recommended indexes:

```text
index(club_id, game_id, season, rank)
index(user_id)
```

## Backend Endpoints Needed

### Get Platform Leaderboard

```http
GET /api/leaderboards?gameId=13&season=2026
```

Auth:

- Public endpoint.
- No token required.

Query parameters:

```text
gameId: number, required by current frontend behavior
season: string, optional but frontend currently always sends it
```

Recommended validation:

- If `gameId` is missing, return `400 Bad Request`.
- If `gameId` does not exist, return `404 Not Found` or `200 []`. Prefer `200 []` if the game exists but has no standings.
- If `season` is missing, backend can default to current year, but frontend currently sends it.

Request body:

```json
null
```

Response body:

```json
[
  {
    "id": 1,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 214.8,
    "tournamentsPlayed": 8,
    "wins": 5,
    "bestFinish": 1
  }
]
```

Response notes:

- Return an array, not a paged object, unless the frontend is updated.
- Sort ascending by `rank`.
- Include player display fields directly: `nickname`, `avatarUrl`.
- Use camelCase JSON property names.
- `avatarUrl` can be `null` or empty string; current UI handles nullish values.
- `ratingPoints` should be a number, not a string.
- `bestFinish` should ideally allow `null`, although the current TypeScript type says `number`.

### Get Club Leaderboard

```http
GET /api/clubs/{clubId}/leaderboards?gameId=13&season=2026
```

Auth:

- Can be public if club pages are public.
- If the project wants private club stats, require auth. Current frontend treats club leaderboard as public inside the public club page.

Path parameters:

```text
clubId: number, required
```

Query parameters:

```text
gameId: number, required by current frontend behavior
season: string, optional but frontend currently always sends it
```

Recommended validation:

- If `clubId` does not exist, return `404 Not Found`.
- If `gameId` is missing, return `400 Bad Request`.
- If the club exists but has no leaderboard for that game/season, return `200 []`.
- If the game is not in the club's inventory, return `200 []` or `400 Bad Request`. Prefer `200 []` for UI simplicity.

Request body:

```json
null
```

Response body:

```json
[
  {
    "id": 1,
    "clubId": 456,
    "gameId": 13,
    "season": "2026",
    "userId": 234,
    "nickname": "TabletopKing",
    "avatarUrl": "https://i.pravatar.cc/300?img=12",
    "rank": 1,
    "ratingPoints": 128.4,
    "gamesPlayed": 18,
    "wins": 11
  }
]
```

Response notes:

- Return an array, not a paged object, unless the frontend is updated.
- Sort ascending by `rank`.
- Include player display fields directly.
- Use camelCase JSON property names.

## Optional Backend Write/Admin Endpoints

The current frontend does not call any write endpoints for leaderboards. These are optional backend/admin endpoints if recalculation needs to be triggered manually.

### Recalculate Platform Leaderboard

```http
POST /api/leaderboards/recalculate
```

Auth:

- App admin only.

Request body:

```json
{
  "gameId": 13,
  "season": "2026"
}
```

Response body:

```json
{
  "gameId": 13,
  "season": "2026",
  "entriesUpdated": 24,
  "updatedAt": "2026-07-08T12:00:00Z"
}
```

### Recalculate Club Leaderboard

```http
POST /api/clubs/{clubId}/leaderboards/recalculate
```

Auth:

- Club admin or app admin.

Request body:

```json
{
  "gameId": 13,
  "season": "2026"
}
```

Response body:

```json
{
  "clubId": 456,
  "gameId": 13,
  "season": "2026",
  "entriesUpdated": 12,
  "updatedAt": "2026-07-08T12:00:00Z"
}
```

## Relationship With Player Public Profiles

The public player profile mock uses platform leaderboard entries to build the player's ranking list.

Current player profile ranking shape:

```json
{
  "gameId": 13,
  "season": "2026",
  "rank": 1,
  "ratingPoints": 214.8
}
```

If the backend adds public player profiles later, it should reuse the same leaderboard data so `/players/:id` can show:

- Current stats summary
- Per-game ranking rows
- Recent tournaments

This is separate from the leaderboard list endpoints, but the data should be consistent.

## Frontend Integration Changes Needed Later

When backend endpoints are ready, update `src/entities/leaderboard/api/index.ts`.

Current mock-only pattern:

```ts
return mockRequest<PlatformLeaderboardEntry[]>(
  `/api/leaderboards${query}`,
  {},
);
```

Backend-ready pattern:

```ts
return apiClient<PlatformLeaderboardEntry[]>(`/api/leaderboards${query}`);
```

And for club leaderboards:

```ts
return apiClient<ClubLeaderboardEntry[]>(
  `/api/clubs/${clubId}/leaderboards${query}`,
);
```

Also update the import:

```ts
import { apiClient } from "@shared/api/client";
```

Remove:

```ts
import { mockRequest } from "@shared/api/mockApi";
```

## Edge Cases the Backend Should Handle

- No leaderboard entries: return `200 []`.
- Unknown game id: return `404` or `200 []`; choose one convention and keep it consistent.
- Unknown club id: return `404`.
- Deleted or inactive users: exclude them from public leaderboard responses.
- Deleted or inactive clubs: exclude or return `404` from public club leaderboards.
- Tied rating points: use deterministic tie-breaking. Suggested order:
  1. Higher `ratingPoints`
  2. More `wins`
  3. Better `bestFinish`
  4. More `tournamentsPlayed` or `gamesPlayed`
  5. Lower `userId`
- Rank values should be stored or returned as final display ranks.
- If ranks are recalculated dynamically, make sure the response is stable between requests.

## Minimum Contract Required By Current Frontend

The frontend will work if the backend provides these two read endpoints:

```http
GET /api/leaderboards?gameId={gameId}&season={season}
GET /api/clubs/{clubId}/leaderboards?gameId={gameId}&season={season}
```

Both endpoints should return JSON arrays in the exact camelCase shapes shown above.

No request bodies are needed for the frontend-read flow.
