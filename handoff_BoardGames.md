# MeepleHub Board Games API Handoff for Frontend

This handoff explains exactly which endpoints exist in `BoardGamesController`, which DTOs they accept/return, auth rules, query/body params, validation behavior, and suggested UI mappings.

---

## 1) Controller Scope

- Controller: `BoardGamesController`
- Base route: `/api/boardgames`
- Tech context: `.NET 8`, `C# 12`

---

## 2) DTO Index (Quick Reference)

### Request DTOs

- `GetBoardGamesQueryDto` (query params for list)
- `SearchBggBoardGamesRequestDto` (POST body for BGG search)

### Response DTOs

- `GetBoardGamesResponseDto`
- `BoardGameInfoDto`
- `CategoryDto`
- `BggSearchBoardGameDto`
- `BggBoardGameDetailsDto`
- `ImportHotBoardGamesResponseDto`

---

## 3) Endpoint → DTO Mapping (Most Important Section)

## 3.1 `GET /api/boardgames`

### Auth

- `AllowAnonymous` (public)

### Request DTO

- Query: `GetBoardGamesQueryDto`

Fields:

- `search?: string`
- `page?: number`
- `pageSize?: number`
- `categoryId?: number`
- `players?: number`
- `sortBy?: string` (`rank` or `title`)
- `sortDirection?: string` (`asc` or `desc`)

### Response DTO

- `200 OK` → `GetBoardGamesResponseDto`

`GetBoardGamesResponseDto`:

- `page: number`
- `pageSize: number`
- `totalCount: number`
- `totalPages: number`
- `items: BoardGameInfoDto[]`

`BoardGameInfoDto` item shape:

- `boardGameId: number`
- `title: string`
- `description: string`
- `year: number | null`
- `minPlayers: number | null`
- `maxPlayers: number | null`
- `bestPlayersCount: number | null`
- `minPlayerAge: number | null`
- `suggestedPlayerAge: number | null`
- `minPlayingTime: number | null`
- `maxPlayingTime: number | null`
- `complexity: number | null`
- `bggOverallRank: number | null`
- `bggGeekRating: number | null`
- `bggAvgRating: number | null`
- `bggVoters: number | null`
- `imageUrl: string`
- `categories: CategoryDto[]`

`CategoryDto`:

- `id: number`
- `name: string`

### Validation/behavior from backend service

- Defaults if omitted:
  - `page = 1`
  - `pageSize = 50`
  - `sortBy = rank`
  - `sortDirection = asc`
- Rules:
  - `page > 0`
  - `pageSize > 0 && pageSize <= 100`
  - `players > 0` (if provided)
  - `categoryId > 0` (if provided)
  - `sortBy` must be `rank` or `title`
  - `sortDirection` must be `asc` or `desc`

### Example request

`GET /api/boardgames?search=catan&page=1&pageSize=20&categoryId=3&players=4&sortBy=rank&sortDirection=asc`

### Example response (trimmed)

```json
{
  "page": 1,
  "pageSize": 20,
  "totalCount": 126,
  "totalPages": 7,
  "items": [
    {
      "boardGameId": 10,
      "title": "Catan",
      "description": "...",
      "year": 1995,
      "minPlayers": 3,
      "maxPlayers": 4,
      "bestPlayersCount": 4,
      "minPlayerAge": 10,
      "suggestedPlayerAge": 12,
      "minPlayingTime": 60,
      "maxPlayingTime": 120,
      "complexity": 2.31,
      "bggOverallRank": 510,
      "bggGeekRating": 6.9,
      "bggAvgRating": 7.1,
      "bggVoters": 100000,
      "imageUrl": "https://...",
      "categories": [{ "id": 1, "name": "Economic" }]
    }
  ]
}
```

---

## 3.2 `GET /api/boardgames/categories`

### Auth

- `AllowAnonymous` (public)

### Request DTO

- None

### Response DTO

- `200 OK` → `List<CategoryDto>`

### Example response

```json
[
  { "id": 1, "name": "Abstract Strategy" },
  { "id": 2, "name": "Economic" }
]
```

### UI usage

- Use for category filter dropdown/chips on board game listing/search pages.

---

## 3.3 `GET /api/boardgames/{id}`

### Auth

- `AllowAnonymous` (public)

### Request DTO

- Route param only: `id` (int)

### Response DTO

- `200 OK` → `BoardGameInfoDto`

### Error cases

- `400` if `id <= 0`
- `404` if board game not found

### UI usage

- Board game details page/modal from local DB.

---

## 3.4 `GET /api/boardgames/bgg-search?bggid={id}`

### Auth

- `Authorize(Roles = "ClubAdmin")`

### Request DTO

- Query param: `bggid` (mapped to `bggId` int)

### Response DTO

- `200 OK` → `BggBoardGameDetailsDto`

`BggBoardGameDetailsDto` shape:

- `bggId: number`
- `title: string`
- `description: string`
- `year: number | null`
- `minPlayers: number | null`
- `maxPlayers: number | null`
- `bestPlayersCount: number | null`
- `minPlayerAge: number | null`
- `suggestedPlayerAge: number | null`
- `minPlayingTime: number | null`
- `maxPlayingTime: number | null`
- `complexity: number | null`
- `bggOverallRank: number | null`
- `bggGeekRating: number | null`
- `bggAvgRating: number | null`
- `bggVoters: number | null`
- `imageUrl: string`
- `categories: string[]` ← note this is **string list**, not `CategoryDto[]`

### Error cases

- `400` if `bggid <= 0`
- `404` if BGG game not found
- `401/403` if user missing auth/role

### UI usage

- In “Add game to club catalog” flow:
  1. Search candidates
  2. Click candidate
  3. Call this endpoint to show detail preview modal

---

## 3.5 `POST /api/boardgames/bgg-search`

### Auth

- `Authorize(Roles = "ClubAdmin")`

### Request DTO

- Body: `SearchBggBoardGamesRequestDto`

Shape:

```json
{
  "keyword": "Dominion"
}
```

### Validation

- `keyword` required
- min length = 3
- max length = 100

### Response DTO

- `200 OK` → `List<BggSearchBoardGameDto>`

`BggSearchBoardGameDto`:

- `bggId: number`
- `title: string`
- `year: number | null`

### Example response

```json
[
  { "bggId": 36218, "title": "Dominion", "year": 2008 },
  { "bggId": 51811, "title": "Dominion: Intrigue", "year": 2009 }
]
```

### UI usage

- Autocomplete or search results table/list for club admins.

---

## 3.6 `POST /api/boardgames/import/hot`

### Auth

- `Authorize(Policy = AppAdmin)`

### Request DTO

- None

### Response DTO

- `200 OK` → `ImportHotBoardGamesResponseDto`

`ImportHotBoardGamesResponseDto`:

- `requestedCount: number`
- `processedCount: number`
- `insertedCount: number`
- `updatedCount: number`

### UI usage

- Admin-only tooling page/button (usually hidden from general users).

---

## 3.7 `POST /api/boardgames/seed-from-csv?offset=0&count=100`

### Auth

- `Authorize(Policy = AppAdmin)`

### Request DTO

- Query only:
  - `offset` default `0`
  - `count` default `100`

### Response DTO

- `200 OK` → `ImportHotBoardGamesResponseDto`

### Error behavior

- `404 NotFound` plain text message if `boardgames_ranks.csv` missing
- `400 BadRequest` plain text message if no valid IDs in range

### UI usage

- Admin-only bulk import utility.

---

## 4) Error Contract (Global)

Most thrown application exceptions are returned as `application/problem+json`:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "'pageSize' must be less than or equal to 100."
}
```

Common statuses to handle in frontend:

- `400` invalid parameters/body
- `401` unauthenticated for protected endpoint
- `403` authenticated but missing required role/policy
- `404` not found
- `500` unexpected server error

Note: `seed-from-csv` currently may return plain string messages for some failures (not DTO).

---

## 5) Frontend Flow Suggestions

## Public pages

1. Load categories once via `GET /api/boardgames/categories`
2. List page uses `GET /api/boardgames` with filter/sort/pagination controls
3. Details page uses `GET /api/boardgames/{id}`

## ClubAdmin “Add game” flow

1. User types keyword (>=3 chars)
2. `POST /api/boardgames/bgg-search` returns candidates (`BggSearchBoardGameDto[]`)
3. User selects item
4. `GET /api/boardgames/bgg-search?bggid=...` returns full BGG details (`BggBoardGameDetailsDto`)
5. Confirm Add → call Clubs endpoint that performs add (separate controller)

## Admin tools

- `POST /api/boardgames/import/hot`
- `POST /api/boardgames/seed-from-csv`

---

## 6) TypeScript Interfaces (Ready to Paste)

```ts
export interface CategoryDto {
  id: number;
  name: string;
}

export interface BoardGameInfoDto {
  boardGameId: number;
  title: string;
  description: string;
  year: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayersCount: number | null;
  minPlayerAge: number | null;
  suggestedPlayerAge: number | null;
  minPlayingTime: number | null;
  maxPlayingTime: number | null;
  complexity: number | null;
  bggOverallRank: number | null;
  bggGeekRating: number | null;
  bggAvgRating: number | null;
  bggVoters: number | null;
  imageUrl: string;
  categories: CategoryDto[];
}

export interface GetBoardGamesResponseDto {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: BoardGameInfoDto[];
}

export interface SearchBggBoardGamesRequestDto {
  keyword: string;
}

export interface BggSearchBoardGameDto {
  bggId: number;
  title: string;
  year: number | null;
}

export interface BggBoardGameDetailsDto {
  bggId: number;
  title: string;
  description: string;
  year: number | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  bestPlayersCount: number | null;
  minPlayerAge: number | null;
  suggestedPlayerAge: number | null;
  minPlayingTime: number | null;
  maxPlayingTime: number | null;
  complexity: number | null;
  bggOverallRank: number | null;
  bggGeekRating: number | null;
  bggAvgRating: number | null;
  bggVoters: number | null;
  imageUrl: string;
  categories: string[];
}

export interface ImportHotBoardGamesResponseDto {
  requestedCount: number;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
}
```

---

## 7) Auth Visibility Matrix for UI

- Public users:
  - `GET /api/boardgames`
  - `GET /api/boardgames/categories`
  - `GET /api/boardgames/{id}`

- ClubAdmin only:
  - `GET /api/boardgames/bgg-search?bggid=...`
  - `POST /api/boardgames/bgg-search`

- AppAdmin only:
  - `POST /api/boardgames/import/hot`
  - `POST /api/boardgames/seed-from-csv`

Use this matrix to show/hide controls in UI and avoid unnecessary 401/403 calls.
