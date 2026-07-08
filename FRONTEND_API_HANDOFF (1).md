# MeepleHub API — Frontend Handoff

This document describes **implemented** API endpoints: request/response JSON shapes, auth rules, enums, and how data is stored in PostgreSQL.

**Base URL (local dev):** `http://localhost:5051`  
**Swagger:** `http://localhost:5051/swagger`

All JSON property names are **camelCase** (ASP.NET Core default).

---

## Authentication

### Header

```
Authorization: Bearer <jwt_token>
```

### JWT contents (decode on frontend)

| Claim         | Description                   |
| ------------- | ----------------------------- |
| `UserId`      | Logged-in user id (string)    |
| `email`       | User email                    |
| `unique_name` | Nickname                      |
| `FullName`    | `"FirstName LastName"`        |
| `role`        | One or more roles (see below) |

### Roles in JWT

Assigned at **login** and **register**:

| Role        | When                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `AppAdmin`  | Login email + password match `AppAdmin` section in server `appsettings.json` (not stored in DB) |
| `ClubAdmin` | User has `Admin` role in at least one club (`user_clubs`)                                       |
| `Player`    | Default if user has no club admin/moderator role                                                |

A user can have **multiple** roles, e.g. `["AppAdmin", "ClubAdmin"]`.

> **Note:** `LoginResponse` does not include roles — decode the JWT or call `GET /api/auth/me` for profile data.
>
> **Current behavior:** the API no longer uses a separate `ClubModerator` role. Club management roles are effectively `AppAdmin`, `ClubAdmin`, and `Player`.

---

## Enums

### Gender (request body — number)

| Value | Name   |
| ----- | ------ |
| `0`   | Male   |
| `1`   | Female |
| `2`   | Other  |

In **responses**, gender is returned as a **string**: `"Male"`, `"Female"`, `"Other"`.

### UserStatus (string in API)

`Active` | `Suspended` | `Deleted`

### UserClubRole (string in API responses)

`Admin`

---

## Error responses (common)

| Status | Meaning                                                                |
| ------ | ---------------------------------------------------------------------- |
| `400`  | Validation error (FluentValidation) or bad request                     |
| `401`  | Missing/invalid token, or wrong login credentials                      |
| `403`  | Logged in but not allowed (wrong user, inactive account, missing role) |
| `404`  | Resource not found                                                     |
| `409`  | Duplicate email, nickname, or phone                                    |

### Validation error body (`400`)

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "gender": ["Gender is required."],
    "password": ["Password must contain at least one uppercase letter."]
  }
}
```

### Simple / domain error body (`401`, `404`, `409`, etc.)

JSON **ProblemDetails** (`application/problem+json`):

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.2",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password."
}
```

---

# Auth endpoints (`/api/auth`)

## POST `/api/auth/login`

**Auth:** None

### Request

```json
{
  "email": "alice@example.com",
  "password": "password"
}
```

| Field    | Required | Rules                      |
| -------- | -------- | -------------------------- |
| email    | Yes      | Valid email, max 254 chars |
| password | Yes      | Not empty                  |

### Response `200`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "nickname": "gamer01",
  "firstName": "Alice",
  "lastName": "Smith",
  "expiresAt": "2026-06-28T15:00:00Z"
}
```

### Other statuses

- `400` — invalid email format
- `401` — wrong credentials
- `403` — account not `Active`

### Database

- Reads `users` row by email (case-insensitive)
- Password verified with BCrypt **unless** login matches configured AppAdmin credentials (see server config)
- Does **not** write to DB

---

## GET `/api/auth/me`

**Auth:** Bearer token (any logged-in user)

### Response `200`

```json
{
  "id": 1,
  "nickname": "gamer01",
  "email": "alice@example.com",
  "avatarUrl": "",
  "clubs": [
    {
      "id": 1,
      "name": "Downtown Boardgames",
      "role": "Admin",
      "logoUrl": "",
      "description": "",
      "address": "123 Main St",
      "city": "Springfield",
      "email": "contact@downtownbg.example",
      "phone": "321-654-0987",
      "workingHours": ""
    }
  ]
}
```

> Only clubs where the user is **Admin** or **Moderator** are included.

### Other statuses

- `401` — no/invalid token
- `403` — user suspended/deleted
- `404` — user not found

### Database

- Reads `users` + `user_clubs` + `clubs` (join)

---

## POST `/api/auth/password`

**Auth:** Bearer token

### Request

```json
{
  "currentPassword": "password",
  "newPassword": "NewSecure1!"
}
```

| Field       | Rules                                       |
| ----------- | ------------------------------------------- |
| newPassword | 8+ chars, upper, lower, digit, special char |

### Response `204`

No body.

### Database (`users` table)

| Column       | Change          |
| ------------ | --------------- |
| `password`   | New BCrypt hash |
| `updated_at` | Set to UTC now  |

---

## POST `/api/auth/forgot-password`

**Auth:** None

### Request

```json
{
  "email": "alice@example.com"
}
```

### Response `200`

```json
"If the account exists, a reset token has been generated."
```

Always returns `200` (does not reveal if email exists).

### Database (`password_reset_tokens` table)

| Column       | Value                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `user_id`    | User id                                                                  |
| `token_hash` | SHA-256 hash of raw token (token logged in dev console, not emailed yet) |
| `expires_at` | UTC now + 15 minutes                                                     |
| `created_at` | UTC now                                                                  |
| `used_at`    | `null`                                                                   |

---

## POST `/api/auth/reset-password`

**Auth:** None

### Request

```json
{
  "tokenFromEmail": "RAW_TOKEN_FROM_EMAIL_OR_LOGS",
  "newPassword": "NewSecure1!"
}
```

### Response `204`

No body.

### Database

- `users.password` — new BCrypt hash
- `users.updated_at` — UTC now
- `password_reset_tokens.used_at` — set to UTC now

---

# Users endpoints (`/api/users`)

## POST `/api/users` — Register

**Auth:** None

### Request

```json
{
  "nickname": "newplayer",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+995555123456",
  "password": "SecurePass1!",
  "birthday": "2000-01-15T00:00:00Z",
  "gender": 1
}
```

| Field     | Required | Rules                               |
| --------- | -------- | ----------------------------------- |
| nickname  | Yes      | Max 50, unique (case-insensitive)   |
| firstName | Yes      | Max 100                             |
| lastName  | Yes      | Max 100                             |
| email     | Yes      | Valid email, max 254, unique        |
| phone     | Yes      | Max 20, unique                      |
| password  | Yes      | 8+, upper, lower, digit, special    |
| birthday  | Yes      | Must be in the past (ISO 8601 date) |
| gender    | Yes      | `0`, `1`, or `2` — omitting → `400` |

### Response `201`

```json
{
  "userId": 4,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "User account created successfully."
}
```

### Other statuses

- `400` — validation
- `409` — duplicate email, nickname, or phone

### Database (`users` table)

| Column                     | How saved                               |
| -------------------------- | --------------------------------------- |
| `nickname`                 | Trimmed (original casing kept)          |
| `first_name`, `last_name`  | Trimmed                                 |
| `email`                    | Trimmed, **lowercased**                 |
| `phone`                    | Trimmed                                 |
| `password`                 | **BCrypt hash** (never returned in API) |
| `birthday`                 | UTC                                     |
| `gender`                   | Integer `0`/`1`/`2`                     |
| `status`                   | `Active` (0)                            |
| `avatar_url`               | `null`                                  |
| `admin_note`               | `null`                                  |
| `created_at`, `updated_at` | UTC now                                 |
| `deleted_at`               | `null`                                  |

New users get JWT with `Player` role (or club role if pre-seeded in `user_clubs`).

---

## GET `/api/users` — List users (admin)

**Auth:** AppAdmin policy (`AppAdmin` role in JWT)

### Query parameters

| Param    | Type   | Default | Description                         |
| -------- | ------ | ------- | ----------------------------------- |
| status   | string | all     | `Active`, `Suspended`, or `Deleted` |
| page     | int    | 1       | Page number (min 1)                 |
| pageSize | int    | 50      | Max 100                             |

Example: `GET /api/users?status=Active&page=1&pageSize=10`

### Response `200`

```json
{
  "items": [
    {
      "id": 1,
      "nickname": "gamer01",
      "email": "alice@example.com",
      "status": "Active",
      "createdAt": "2026-01-10T10:00:00Z"
    }
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 10
}
```

### Other statuses

- `401` — no token
- `403` — not AppAdmin

### Database

- Reads `users` with optional `status` filter, ordered by `id`, paginated

---

## GET `/api/users/search` — Search active users

**Auth:** Any logged-in user

### Query parameters

| Param | Required | Rules            |
| ----- | -------- | ---------------- |
| q     | Yes      | Min 2 characters |

Example: `GET /api/users/search?q=ali`

### Response `200`

```json
[
  {
    "id": 1,
    "nickname": "gamer01",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com",
    "avatarUrl": ""
  }
]
```

> Only **Active** users. Max **20** results. Email included so players can contact each other.

### Other statuses

- `400` — query too short
- `401` — no token

---

## DELETE `/api/users/me` — Deactivate own account

**Auth:** Bearer token (self)

### Response `204`

No body.

### Database (`users` table)

| Column       | Value     |
| ------------ | --------- |
| `status`     | `Deleted` |
| `deleted_at` | UTC now   |
| `updated_at` | UTC now   |

After deactivation, login returns **403** (`User is not active.`).

---

## GET `/api/users/{id}` — User profile

**Auth:** Any logged-in user

### Response `200` — viewing another **Active** user (`UserPublicProfileDto`)

```json
{
  "id": 2,
  "nickname": "boardmaster",
  "firstName": "Bob",
  "lastName": "Johnson",
  "email": "bob@example.com",
  "avatarUrl": ""
}
```

> No `phone`, `birthday`, `gender`, or `status` for other users.

### Response `200` — viewing **self** or as **AppAdmin** (`UserDetailDto`)

```json
{
  "id": 1,
  "nickname": "gamer01",
  "firstName": "Alice",
  "lastName": "Smith",
  "birthday": "1995-03-12T00:00:00Z",
  "gender": "Female",
  "email": "alice@example.com",
  "phone": "123-456-7890",
  "avatarUrl": "",
  "status": "Active",
  "updatedAt": "2026-06-28T12:00:00Z"
}
```

### Other statuses

- `401` — no token
- `404` — user not found, or Suspended/Deleted when viewed by non-admin

### Database

- Reads single row from `users`

---

## PATCH `/api/users/{id}` — Update profile

**Auth:** Self only (JWT `UserId` must match `{id}`)

### Request (all fields optional, at least one required)

```json
{
  "nickname": "gamer01",
  "firstName": "Alice",
  "lastName": "Smith",
  "birthday": "1995-03-12T00:00:00Z",
  "gender": 1,
  "phone": "+995555999888",
  "avatarUrl": "https://cdn.example.com/avatar.png"
}
```

Send `avatarUrl: ""` or `null` to clear avatar.

### Response `200`

Same shape as `GET /api/users/{id}` (`UserDetailDto`).

### Other statuses

- `400` — validation / no fields sent
- `401` — invalid token
- `403` — updating another user's profile, or account inactive
- `404` — user not found
- `409` — nickname or phone already taken

### Database (`users` table)

Only sent fields are updated; `updated_at` set to UTC now.

| Field     | DB column                        |
| --------- | -------------------------------- |
| nickname  | `nickname`                       |
| firstName | `first_name`                     |
| lastName  | `last_name`                      |
| birthday  | `birthday` (UTC)                 |
| gender    | `gender` (int)                   |
| phone     | `phone`                          |
| avatarUrl | `avatar_url` (`null` if cleared) |

---

## GET `/api/users/{id}/clubs` — Managed clubs

**Auth:** Self **or** AppAdmin

### Response `200`

```json
[
  {
    "id": 1,
    "name": "Downtown Boardgames",
    "role": "Admin"
  },
  {
    "id": 2,
    "name": "University Meeple Club",
    "role": "Moderator"
  }
]
```

> Only clubs where user is **Admin** or **Moderator** (not plain member).

### Other statuses

- `401` — invalid token
- `403` — viewing another user's clubs without AppAdmin
- `404` — user not found

### Database

- `user_clubs` filtered by `user_id` and `role` in (`Admin`, `Moderator`)
- Joined with `clubs` for name

---

## PATCH `/api/users/{id}/status` — Change user status (admin)

**Auth:** AppAdmin policy

### Request

```json
{
  "status": "Suspended",
  "reason": "Violated community rules"
}
```

| Field  | Required | Values                              |
| ------ | -------- | ----------------------------------- |
| status | Yes      | `Active`, `Suspended`, `Deleted`    |
| reason | No       | Max 500 chars → saved as admin note |

### Response `200`

Same shape as `GET /api/users/{id}`.

### Other statuses

- `400` — invalid status
- `401` — no token
- `403` — not AppAdmin
- `404` — user not found

### Database (`users` table)

| Column       | Value                                        |
| ------------ | -------------------------------------------- |
| `status`     | `Active` / `Suspended` / `Deleted`           |
| `admin_note` | `reason` (trimmed) or `null`                 |
| `updated_at` | UTC now                                      |
| `deleted_at` | UTC now if `Deleted`, **`null` if `Active`** |

---

# Database schema (PostgreSQL)

# Tournament endpoints (`/api/tournaments`)

Tournament endpoints are fully implemented.

Important frontend notes:

- Authenticated tournament management is limited to `ClubAdmin`
- Public users can list and view only non-draft, non-cancelled tournaments
- All tournament date fields must be sent as **UTC ISO strings** with `Z`
- Tournament-related enums are sent as **numbers**
- `myRegistration` in tournament detail is only populated for the currently authenticated user

## Tournament enums

### TournamentType (number in request/response)

| Value | Name       |
| ----- | ---------- |
| `0`   | League     |
| `1`   | Knockout   |
| `2`   | MultiStage |

### TournamentStatus (number in response)

| Value | Name               |
| ----- | ------------------ |
| `0`   | Draft              |
| `1`   | Published          |
| `2`   | RegistrationOpen   |
| `3`   | RegistrationClosed |
| `4`   | InProgress         |
| `5`   | Finished           |
| `6`   | Cancelled          |

### TournamentRegistrationStatus (number in response / query)

| Value | Name       |
| ----- | ---------- |
| `0`   | Accepted   |
| `1`   | Waitlisted |
| `2`   | Cancelled  |

---

## POST `/api/tournaments` — Create draft tournament

**Auth:** Bearer token, `ClubAdmin` for the target club

### Request

```json
{
  "clubId": 1,
  "name": "Autumn League",
  "description": "Swiss-style community tournament",
  "tournamentType": 0,
  "registrationOpensAt": "2026-07-10T10:00:00.000Z",
  "registrationClosesAt": "2026-07-10T12:00:00.000Z",
  "cancellationDeadline": "2026-07-10T13:00:00.000Z",
  "startsAt": "2026-07-10T15:00:00.000Z",
  "endsAt": "2026-07-10T19:00:00.000Z",
  "minParticipants": 4,
  "maxParticipants": 16,
  "location": "Main Hall",
  "entryFee": 10,
  "boardGameIds": [22, 31]
}
```

### Response `201`

```json
{
  "id": 12,
  "clubId": 1,
  "name": "Autumn League",
  "description": "Swiss-style community tournament",
  "tournamentType": 0,
  "status": 0,
  "startsAt": "2026-07-10T15:00:00Z",
  "endsAt": "2026-07-10T19:00:00Z",
  "registrationOpensAt": "2026-07-10T10:00:00Z",
  "registrationClosesAt": "2026-07-10T12:00:00Z",
  "cancellationDeadline": "2026-07-10T13:00:00Z",
  "minParticipants": 4,
  "maxParticipants": 16,
  "location": "Main Hall",
  "entryFee": 10,
  "boardGames": [
    {
      "boardGameId": 22,
      "title": "Terraforming Mars",
      "imageUrl": "",
      "year": 2016
    }
  ],
  "createdAt": "2026-07-08T19:00:00Z"
}
```

### Validation / business rules

- `clubId` must exist and be active
- caller must be a club admin for that club
- `tournamentType` is required
- at least one board game must be provided
- all dates must be UTC
- date chain must satisfy:
  - `registrationOpensAt < registrationClosesAt <= cancellationDeadline < startsAt`
  - `endsAt > startsAt` when present
- `minParticipants >= 1`
- `maxParticipants >= minParticipants`
- `entryFee >= 0` when present

### Other statuses

- `400` — validation or invalid date chain / invalid board game ids
- `401` — no/invalid token
- `403` — not club admin for that club / inactive user / inactive club
- `404` — club not found

---

## PUT `/api/tournaments/{id}` — Update tournament

**Auth:** Bearer token, `ClubAdmin` for that tournament’s club

### Request

```json
{
  "name": "Autumn League Updated",
  "description": "Updated description",
  "tournamentType": 0,
  "registrationOpensAt": "2026-07-10T10:00:00.000Z",
  "registrationClosesAt": "2026-07-10T12:30:00.000Z",
  "cancellationDeadline": "2026-07-10T13:30:00.000Z",
  "startsAt": "2026-07-10T15:00:00.000Z",
  "endsAt": "2026-07-10T19:30:00.000Z",
  "minParticipants": 4,
  "maxParticipants": 16,
  "location": "Secondary Hall",
  "entryFee": 12,
  "boardGameIds": [22, 31]
}
```

### Response `204`

No body.

### Update rules by status

- `Draft`: full update allowed
- `Published` / `RegistrationOpen`:
  - cannot change `tournamentType`
  - cannot change `startsAt`
  - cannot change `minParticipants` / `maxParticipants`
  - cannot change `boardGameIds`
  - can still change `description`, `location`, `registrationClosesAt`, `cancellationDeadline`, optional `endsAt`
- `RegistrationClosed`:
  - only `description` and `location` are editable
- `InProgress`, `Finished`, `Cancelled`:
  - editing forbidden

### Other statuses

- `400` — invalid date changes / forbidden field changes for current status
- `401` — no/invalid token
- `403` — not club admin
- `404` — tournament not found

---

## POST `/api/tournaments/{id}/publish` — Publish tournament

**Auth:** Bearer token, `ClubAdmin`

### Request

No body.

### Response `204`

No body.

### Rules

- only `Draft` tournaments can be published
- tournament must already have at least one board game
- `registrationOpensAt` must still be in the future at publish time

### Other statuses

- `400` — invalid status / registration already in the past / invalid data
- `401` — no/invalid token
- `403` — not club admin
- `404` — tournament not found

---

## POST `/api/tournaments/{id}/cancel` — Cancel tournament

**Auth:** Bearer token, `ClubAdmin`

### Request

No body.

### Response `204`

No body.

### Behavior

- sets tournament status to `Cancelled`
- all non-cancelled registrations for that tournament are marked `Cancelled`
- cancelled tournaments are hidden from public detail/list views

### Other statuses

- `400` — already `Finished` or already `Cancelled`
- `401` — no/invalid token
- `403` — not club admin
- `404` — tournament not found

---

## GET `/api/tournaments` — Public tournament list

**Auth:** None

### Query parameters

| Param         | Type         | Default    | Description                               |
| ------------- | ------------ | ---------- | ----------------------------------------- |
| page          | int          | `1`        | Min 1                                     |
| pageSize      | int          | `20`       | Max 100                                   |
| clubId        | int          | —          | Filter by club                            |
| type          | int          | —          | `0`, `1`, `2`                             |
| boardGameId   | int          | —          | Filter by board game                      |
| location      | string       | —          | Case-insensitive contains                 |
| search        | string       | —          | Case-insensitive name search              |
| startsAfter   | datetime UTC | —          | Inclusive                                 |
| startsBefore  | datetime UTC | —          | Inclusive                                 |
| sortBy        | string       | `startsAt` | `name`, `location`, or default start time |
| sortDirection | string       | `asc`      | `asc` or `desc`                           |

Only tournaments whose status is **not** `Draft` and **not** `Cancelled` are returned.

### Response `200`

```json
{
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "items": [
    {
      "id": 12,
      "clubId": 1,
      "clubName": "Meeple Hub Club",
      "name": "Autumn League",
      "tournamentType": 0,
      "status": 1,
      "startsAt": "2026-07-10T15:00:00Z",
      "endsAt": "2026-07-10T19:00:00Z",
      "location": "Main Hall",
      "entryFee": 10,
      "currentParticipants": 0,
      "maxParticipants": 16
    }
  ]
}
```

### Other statuses

- `400` — invalid page/pageSize or non-UTC date filters

---

## GET `/api/tournaments/{id}` — Tournament detail

**Auth:** Optional

### Public/private rules

- `Draft` and `Cancelled` tournaments return `404` to public/non-admin users
- club admins of the tournament’s club can still view `Draft` and `Cancelled`

### Response `200`

```json
{
  "id": 12,
  "name": "Autumn League",
  "clubId": 1,
  "clubName": "Meeple Hub Club",
  "description": "Swiss-style community tournament",
  "status": 2,
  "tournamentType": 0,
  "startsAt": "2026-07-10T15:00:00Z",
  "endsAt": "2026-07-10T19:00:00Z",
  "registrationOpensAt": "2026-07-10T10:00:00Z",
  "registrationClosesAt": "2026-07-10T12:00:00Z",
  "cancellationDeadline": "2026-07-10T13:00:00Z",
  "currentParticipants": 1,
  "maxParticipants": 16,
  "minParticipants": 4,
  "location": "Main Hall",
  "entryFee": 10,
  "myRegistration": {
    "registrationId": 27,
    "status": 0,
    "waitlistPosition": null,
    "registeredAt": "2026-07-10T10:03:00Z"
  },
  "boardGames": [
    {
      "boardGameId": 22,
      "title": "Terraforming Mars",
      "imageUrl": "",
      "year": 2016
    }
  ]
}
```

### `myRegistration`

- `null` for anonymous users
- `null` for logged-in users who are not registered
- populated for the current user when they have a registration (including waitlisted)

### Other statuses

- `404` — tournament not found or intentionally hidden from viewer

---

## POST `/api/tournaments/{id}/registrations` — Register current user

**Auth:** Bearer token

### Request

No body.

### Response `200`

```json
{
  "id": 27,
  "tournamentId": 12,
  "userId": 9,
  "status": 0,
  "waitlistPosition": null,
  "createdAt": "2026-07-10T10:03:00Z"
}
```

Or waitlisted:

```json
{
  "id": 28,
  "tournamentId": 12,
  "userId": 10,
  "status": 1,
  "waitlistPosition": 1,
  "createdAt": "2026-07-10T10:04:00Z"
}
```

### Behavior

- user must be active
- tournament must be in `RegistrationOpen`
- current time must be inside registration window
- current time must be before/equal to cancellation deadline
- duplicate active registration returns conflict
- if accepted slots are full, user is added to waitlist
- if the same user previously cancelled and registers again, their row is reused

### Other statuses

- `400` — registration closed / cancelled tournament / deadline passed
- `401` — no/invalid token
- `403` — inactive user
- `404` — tournament not found
- `409` — active registration already exists

---

## DELETE `/api/tournaments/{id}/registrations/me` — Cancel my registration

**Auth:** Bearer token

### Request

No body.

### Response `204`

No body.

### Behavior

- current user’s registration is marked `Cancelled`
- if the cancelled registration was `Accepted`, the first waitlisted user is promoted
- remaining waitlist positions are renumbered

### Other statuses

- `400` — tournament cancelled / cancellation deadline already passed / registration already cancelled
- `401` — no/invalid token
- `404` — tournament or registration not found

---

## GET `/api/tournaments/my-registrations` — Current user’s tournament registrations

**Auth:** Bearer token

### Query parameters

| Param    | Type | Default |
| -------- | ---- | ------- |
| page     | int  | `1`     |
| pageSize | int  | `20`    |

### Response `200`

```json
{
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "items": [
    {
      "registrationId": 27,
      "tournamentId": 12,
      "tournamentName": "Autumn League",
      "clubId": 1,
      "clubName": "Meeple Hub Club",
      "status": 0,
      "waitlistPosition": null,
      "tournamentStartsAt": "2026-07-10T15:00:00Z",
      "tournamentEndsAt": "2026-07-10T19:00:00Z",
      "location": "Main Hall",
      "entryFee": 10,
      "registeredAt": "2026-07-10T10:03:00Z"
    }
  ]
}
```

Only non-cancelled registrations for the current user are returned.

### Other statuses

- `400` — invalid paging
- `401` — no/invalid token

---

## GET `/api/tournaments/{id}/registrations` — Admin registration list

**Auth:** Bearer token, `ClubAdmin` of the tournament’s club

### Query parameters

| Param    | Type | Default | Description      |
| -------- | ---- | ------- | ---------------- |
| status   | int  | —       | `0`, `1`, or `2` |
| page     | int  | `1`     | Min 1            |
| pageSize | int  | `20`    | Max 100          |

### Response `200`

```json
{
  "page": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1,
  "items": [
    {
      "registrationId": 27,
      "status": 0,
      "waitlistPosition": null,
      "registeredAt": "2026-07-10T10:03:00Z",
      "user": {
        "id": 9,
        "displayName": "playerone",
        "avatarUrl": ""
      }
    },
    {
      "registrationId": 28,
      "status": 1,
      "waitlistPosition": 1,
      "registeredAt": "2026-07-10T10:04:00Z",
      "user": {
        "id": 10,
        "displayName": "playertwo",
        "avatarUrl": ""
      }
    }
  ]
}
```

### Other statuses

- `400` — invalid paging
- `401` — no/invalid token
- `403` — not club admin of that club
- `404` — tournament not found

---

Table/column names use **snake_case**. Enum columns in `users` use integers; `user_clubs.role` is stored as **text** (`"Admin"`). Tournament enum columns are stored as text in PostgreSQL (`"Draft"`, `"Published"`, `"Accepted"`, etc.) even though the API uses numeric enum values.

## `users`

| Column     | Type        | Notes                                |
| ---------- | ----------- | ------------------------------------ |
| id         | int         | PK, auto-increment                   |
| nickname   | text        | Unique                               |
| first_name | text        |                                      |
| last_name  | text        |                                      |
| birthday   | timestamptz |                                      |
| gender     | int         | 0=Male, 1=Female, 2=Other            |
| email      | text        | Unique, stored lowercase             |
| phone      | text        | Unique                               |
| password   | text        | BCrypt hash only                     |
| avatar_url | text        | Nullable                             |
| status     | int         | 0=Active, 1=Suspended, 2=Deleted     |
| admin_note | text        | Nullable, set by admin status change |
| created_at | timestamptz |                                      |
| updated_at | timestamptz |                                      |
| deleted_at | timestamptz | Nullable, set when status=Deleted    |

## `clubs`

| Column                             | Type        | Notes            |
| ---------------------------------- | ----------- | ---------------- |
| id                                 | int         | PK               |
| name                               | text        | Unique           |
| logo_url                           | text        | Nullable         |
| description                        | text        | Nullable         |
| address                            | text        |                  |
| city                               | text        |                  |
| email                              | text        |                  |
| phone                              | text        | Nullable         |
| working_hours                      | text        | Nullable         |
| status                             | int         | Club status enum |
| admin_note                         | text        | Nullable         |
| created_at, updated_at, deleted_at | timestamptz |                  |

## `user_clubs` (junction)

| Column  | Type | Notes      |
| ------- | ---- | ---------- |
| id      | int  | PK         |
| user_id | int  | FK → users |
| club_id | int  | FK → clubs |
| role    | text | `"Admin"`  |

Unique: (`user_id`, `club_id`)

## `password_reset_tokens`

| Column     | Type        | Notes                        |
| ---------- | ----------- | ---------------------------- |
| id         | int         | PK                           |
| user_id    | int         | FK → users                   |
| token_hash | text        | Unique, SHA-256 of raw token |
| expires_at | timestamptz | 15 min from creation         |
| created_at | timestamptz |                              |
| used_at    | timestamptz | Nullable                     |

---

# AppAdmin (important for frontend)

- **Not stored in database.**
- Server reads `AppAdmin:Email` and `AppAdmin:Password` from `appsettings.json`.
- On login, if credentials match config → JWT includes `AppAdmin` role.
- Endpoints requiring AppAdmin:
  - `GET /api/users`
  - `PATCH /api/users/{id}/status`
- AppAdmin can also call `GET /api/users/{id}/clubs` for **any** user id.

---

# Endpoint summary

| Method     | Route                                    | Auth             | Status                        |
| ---------- | ---------------------------------------- | ---------------- | ----------------------------- |
| POST       | `/api/auth/login`                        | —                | ✅                            |
| GET        | `/api/auth/me`                           | Bearer           | ✅                            |
| POST       | `/api/auth/password`                     | Bearer           | ✅                            |
| POST       | `/api/auth/forgot-password`              | —                | ✅                            |
| POST       | `/api/auth/reset-password`               | —                | ✅                            |
| POST       | `/api/users`                             | —                | ✅                            |
| GET        | `/api/users`                             | AppAdmin         | ✅                            |
| GET        | `/api/users/search`                      | Bearer           | ✅                            |
| DELETE     | `/api/users/me`                          | Self             | ✅                            |
| GET        | `/api/users/{id}`                        | Bearer           | ✅ (public or full by viewer) |
| PATCH      | `/api/users/{id}`                        | Self             | ✅                            |
| GET        | `/api/users/{id}/clubs`                  | Self or AppAdmin | ✅                            |
| PATCH      | `/api/users/{id}/status`                 | AppAdmin         | ✅                            |
| POST       | `/api/tournaments`                       | ClubAdmin        | ✅                            |
| PUT        | `/api/tournaments/{id}`                  | ClubAdmin        | ✅                            |
| POST       | `/api/tournaments/{id}/publish`          | ClubAdmin        | ✅                            |
| POST       | `/api/tournaments/{id}/cancel`           | ClubAdmin        | ✅                            |
| GET        | `/api/tournaments`                       | —                | ✅                            |
| GET        | `/api/tournaments/{id}`                  | Optional         | ✅                            |
| POST       | `/api/tournaments/{id}/registrations`    | Bearer           | ✅                            |
| DELETE     | `/api/tournaments/{id}/registrations/me` | Bearer           | ✅                            |
| GET        | `/api/tournaments/my-registrations`      | Bearer           | ✅                            |
| GET        | `/api/tournaments/{id}/registrations`    | ClubAdmin        | ✅                            |
| Clubs CRUD | `/api/clubs/*`                           | —                | ❌ Not implemented            |
| Games CRUD | `/api/games/*`                           | —                | ❌ Not implemented            |

---

# Local seed data (for testing)

| Email             | Password | Notes                              |
| ----------------- | -------- | ---------------------------------- |
| alice@example.com | password | Club admin (seed)                  |
| bob@example.com   | password | Club admin (seed)                  |
| nini@example.com  | password | Club admin for another club (seed) |

Typical ids after fresh seed: alice=`1`, bob=`2`, nini=`3` (may differ if extra users registered).

---

# Frontend checklist

1. Store JWT after login/register; send `Authorization: Bearer <token>` on protected routes.
2. Decode JWT for `role` claims (`AppAdmin`, `ClubAdmin`, `Player`).
3. Use **number** for `gender` in POST/PATCH requests; expect **string** in GET responses.
4. Dates are ISO 8601 UTC (`2026-01-15T00:00:00Z`).
5. Handle `400` validation `errors` object per field.
6. Domain errors (`401`, `404`, `409`, etc.) return JSON ProblemDetails with `detail`.
7. Register returns `201` with `userId` + `token` — user is logged in immediately.
8. `GET /api/users/{id}` returns **different shapes** for self/admin vs other users — type-check `phone` or `status` to distinguish.
9. For tournament create/update requests, send enum values as numbers and all date fields as UTC ISO strings with `Z`.
10. For tournament detail pages, use `myRegistration` to decide whether to show "Register", "Cancel registration", or waitlist state for the current user.
