# AppAdmin API Reference (Endpoints + DTOs)

This document lists API endpoints and DTOs used by **AppAdmin actions** so frontend can build the AppAdmin module UI.

## Authentication for AppAdmin

- AppAdmin uses the same login endpoint as regular users: `POST /api/auth/login`
- The backend grants AppAdmin role/permissions based on configured AppAdmin credentials.
- After login, send JWT in `Authorization: Bearer <token>`.

---

## 1) AppAdmin-only endpoints

## `GET /api/users`
- **Authorization:** `AppAdmin` policy required
- **Purpose:** Get paged users list (optionally filtered by status)
- **Query params:**
  - `status` (`UserStatus?`): `Active | Suspended | Deleted`
  - `page` (`int`, default `1`)
  - `pageSize` (`int`, default `50`, max `100`)
- **Request body:** none
- **Response DTO:** `UserListResponseDto`

## `PATCH /api/users/{id}/status`
- **Authorization:** `AppAdmin` policy required
- **Purpose:** Change user status
- **Route params:**
  - `id` (`int`)
- **Request DTO:** `UpdateUserStatusDto`
- **Response DTO:** `UserDetailDto`

## `PATCH /api/clubs/{id}/status`
- **Authorization:** `AppAdmin` policy required
- **Purpose:** Change club status
- **Route params:**
  - `id` (`int`)
- **Request DTO:** `UpdateClubStatusRequestDto`
- **Response DTO:** `UpdateClubStatusResponseDto`

## `POST /api/boardgames/import/hot`
- **Authorization:** `AppAdmin` policy required
- **Purpose:** Import top hot boardgames from BGG
- **Request body:** none
- **Response DTO:** `ImportHotBoardGamesResponseDto`

## `POST /api/boardgames/seed-from-csv`
- **Authorization:** `AppAdmin` policy required
- **Purpose:** Import boardgames by reading local CSV (`boardgames_ranks.csv`)
- **Query params:**
  - `offset` (`int`, default `0`)
  - `count` (`int`, default `100`)
- **Request body:** none
- **Response DTO:** `ImportHotBoardGamesResponseDto`

---

## 2) AppAdmin-capable endpoints (not AppAdmin-exclusive)

## `GET /api/clubs?status=...`
- **Authorization behavior:**
  - Without `status`: anonymous allowed
  - With `status`: caller must be AppAdmin
- **Purpose:** Get paged clubs; AppAdmin can filter by status
- **Query params:**
  - `page` (`int?`)
  - `pageSize` (`int?`)
  - `status` (`ClubStatus?`): `Pending | Active | Rejected | Suspended | Deleted`
- **Response DTO:** `GetClubsResponseDto`

## `GET /api/users/{id}`
- **Authorization:** authenticated user required
- **AppAdmin behavior:** if caller is AppAdmin, response is full `UserDetailDto` for any user (including deleted users)
- **Response type for AppAdmin use-case:** `UserDetailDto`

## `GET /api/users/{id}/club`
- **Authorization:** authenticated user required
- **AppAdmin behavior:** AppAdmin can request managed clubs for another user
- **Response DTO:** `List<UserClubSummaryDto>`

---

## 3) DTO definitions used by AppAdmin actions

## `UserListResponseDto`
- `List<UserListItemDto> Items`
- `int TotalCount`
- `int Page`
- `int PageSize`

## `UserListItemDto`
- `int Id`
- `string Nickname`
- `string Email`
- `string Status`
- `DateTime CreatedAt`

## `UpdateUserStatusDto`
- `string Status` (`Active | Suspended | Deleted`)
- `string? Reason`

## `UserDetailDto`
- `int Id`
- `string Nickname`
- `string FirstName`
- `string LastName`
- `DateTime Birthday`
- `string Gender`
- `string Email`
- `string Phone`
- `string AvatarUrl`
- `string Status`
- `DateTime UpdatedAt`

## `GetClubsResponseDto`
- `int Page`
- `int PageSize`
- `int TotalCount`
- `int TotalPages`
- `List<GetClubListItemDto> Items`

## `GetClubListItemDto`
- `int ClubId`
- `string Name`
- `string LogoUrl`
- `string Description`
- `string City`
- `string Status`

## `UpdateClubStatusRequestDto`
- `string Status` (`Pending | Active | Rejected | Suspended | Deleted`)
- `string? Reason`

## `UpdateClubStatusResponseDto`
- `int ClubId`
- `string PreviousStatus`
- `string Status`
- `string AdminNote`
- `DateTime UpdatedAt`
- `DateTime? DeletedAt`

## `ImportHotBoardGamesResponseDto`
- `int RequestedCount`
- `int ProcessedCount`
- `int InsertedCount`
- `int UpdatedCount`

## `UserClubSummaryDto`
- `int Id`
- `string Name`
- `string Role`

---

## 4) Login DTOs (needed to access AppAdmin endpoints)

## `POST /api/auth/login`
- **Request DTO:** `LoginRequest`
- **Response DTO:** `LoginResponse`

## `LoginRequest`
- `string Email`
- `string Password`

## `LoginResponse`
- `string Token`
- `int UserId`
- `string Nickname`
- `string FirstName`
- `string LastName`
- `DateTime ExpiresAt`

---

## Notes for frontend

- For AppAdmin module pages, use JWT from login and include it in `Authorization` header.
- Treat `Status` fields as enum-like strings shown above.
- Do **not** hardcode AppAdmin credentials in frontend source code.