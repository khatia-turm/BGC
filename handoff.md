# Clubs API handoff for Frontend
# Clubs API handoff for Frontend

This document is based on `MeepleHub.API/Controllers/ClubsController.cs` and current DTOs used by these endpoints.

## Base route

- `/api/clubs`

## Auth quick reference

- `POST /api/clubs` -> authenticated user
- `PUT /api/clubs/{id}` -> policy `MustBeClubAdmin`
- `PATCH /api/clubs/{id}/status` -> policy `AppAdmin`
- `GET /api/clubs` -> anonymous allowed (but `status` filter has extra auth rules)
- `GET /api/clubs/my` -> authenticated user
- `GET /api/clubs/{id}/my` -> authenticated user
- `GET /api/clubs/{id}` -> anonymous allowed
- `GET /api/clubs/{id}/boardgames` -> anonymous allowed
- `POST /api/clubs/{id}/boardgames` -> policy `MustBeClubAdmin`
- `DELETE /api/clubs/{id}/boardgames/{boardgameId}` -> policy `MustBeClubAdmin`

---

## 1) Create club

### `POST /api/clubs`

Request body (`RegisterClubRequestDto`):

```json
{
  "name": "string",
  "logoUrl": "string | null",
  "description": "string | null",
  "address": "string",
  "city": "string",
  "email": "string",
  "phone": "string | null",
  "workingHours": "string | null"
}
```

Success `201 Created` (`RegisterClubResponseDto`):

```json
{
  "clubId": 0,
  "name": "string",
  "description": "string",
  "status": "Pending",
  "createdAt": "2026-01-01T00:00:00Z",
  "clubAdminId": 0
}
```

---

## 2) Update club

### `PUT /api/clubs/{id}`

Request body (`UpdateClubRequestDto`): same shape as create request.

Success `200 OK` (`UpdateClubResponseDto`):

```json
{
  "clubId": 0,
  "name": "string",
  "description": "string",
  "status": "Active",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

---

## 3) Update club status (AppAdmin)

### `PATCH /api/clubs/{id}/status`

Request body (`UpdateClubStatusRequestDto`):

```json
{
  "status": "Active | Rejected | Suspended | Deleted | Pending",
  "reason": "string | null"
}
```

Success `200 OK` (`UpdateClubStatusResponseDto`):

```json
{
  "clubId": 0,
  "previousStatus": "Pending",
  "status": "Active",
  "adminNote": "string",
  "updatedAt": "2026-01-01T00:00:00Z",
  "deletedAt": null
}
```

---

## 4) List clubs

### `GET /api/clubs?page={n}&pageSize={n}&status={ClubStatus}`

Query params:
- `page` default `1`
- `pageSize` default `10`, max `100`
- `status` optional

Special auth behavior for `status` filter:
- if `status` is provided and caller is anonymous -> `401`
  ```json
  { "message": "Authentication is required to filter clubs by status." }
  ```
- if `status` is provided and caller is authenticated but not AppAdmin -> `403`

Success `200 OK` (`GetClubsResponseDto`):

```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 0,
  "totalPages": 0,
  "items": [
    {
      "clubId": 0,
      "name": "string",
      "logoUrl": "string",
      "description": "string",
      "city": "string",
      "status": "Active"
    }
  ]
}
```

---

## 5) My clubs

### `GET /api/clubs/my?page={n}&pageSize={n}`

Success `200 OK` (`GetMyClubsResponseDto`):

```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 0,
  "totalPages": 0,
  "items": [
    {
      "clubId": 0,
      "name": "string",
      "logoUrl": "string",
      "description": "string",
      "city": "string",
      "role": "Admin | Moderator",
      "status": "Active"
    }
  ]
}
```

---

## 6) Get public club by id

### `GET /api/clubs/{id}`

Success `200 OK` (`GetClubByIdResponseDto`):

```json
{
  "clubId": 0,
  "name": "string",
  "logoUrl": "string",
  "description": "string",
  "address": "string",
  "city": "string",
  "email": "string",
  "phone": "string",
  "workingHours": "string"
}
```

---

## 7) Get my club by id (staff view)

### `GET /api/clubs/{id}/my`

Success `200 OK` (`GetMyClubByIdResponseDto`):

```json
{
  "clubId": 0,
  "name": "string",
  "logoUrl": "string",
  "description": "string",
  "address": "string",
  "city": "string",
  "email": "string",
  "phone": "string",
  "workingHours": "string",
  "status": "Active"
}
```

---

## 8) Get club boardgames

### `GET /api/clubs/{id}/boardgames?search={text}&page={n}&pageSize={n}`

Query params:
- `search` optional (title contains)
- `page` default `1`
- `pageSize` default `10`, max `100`

Success `200 OK` (`GetClubBoardGamesResponseDto`):

```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 0,
  "totalPages": 0,
  "items": [
    {
      "boardGameId": 0,
      "title": "string",
      "description": "string",
      "year": 0,
      "minPlayers": 1,
      "maxPlayers": 4,
      "bestPlayersCount": 4,
      "minPlayerAge": 10,
      "suggestedPlayerAge": 12,
      "minPlayingTime": 30,
      "maxPlayingTime": 90,
      "complexity": 2.5,
      "bggOverallRank": 100,
      "bggGeekRating": 7.8,
      "bggAvgRating": 7.5,
      "bggVoters": 10000,
      "imageUrl": "string",
      "categories": [
        {
          "id": 1,
          "name": "Strategy"
        }
      ]
    }
  ]
}
```

---

## 9) Add boardgame to club inventory

### `POST /api/clubs/{id}/boardgames`

Request body (`AddClubBoardGameRequestDto`):

```json
{
  "bggGameId": 13
}
```

Success `200 OK` (`AddClubBoardGameResponseDto`):

```json
{
  "clubId": 0,
  "boardGameId": 0,
  "bggId": 13,
  "title": "string"
}
```

---

## 10) Remove boardgame from club inventory

### `DELETE /api/clubs/{id}/boardgames/{boardgameId}`

Success `204 No Content`

---

## Error contract

Most errors are returned as `application/problem+json` by global exception middleware:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Human-readable message"
}
```

Common statuses to handle in UI:
- `400` bad request (invalid input/query)
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
