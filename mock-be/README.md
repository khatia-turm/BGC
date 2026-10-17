# Mock API

Both mock transports use `api.js`, which follows the controllers, DTOs, validators, services, and tournament repository in the sibling `meeplehub-api` checkout. No backend or database is needed.

## Run

For the browser mock:

```sh
npm run dev:mock
```

This uses `.env.mock` (`VITE_API_URL=mock`) and persists changes in local storage under `meeplehub-mock-v1`. Login state still uses the application's normal session storage or local storage, depending on Remember me.

To exercise real HTTP requests, run these in separate terminals:

```sh
npm run mock:server
npm run dev
```

Set `VITE_API_URL=http://localhost:5051` in `.env` for HTTP mode and restart Vite. The server accepts localhost/127.0.0.1 frontend origins on any port, including PUT preflights. `PORT` overrides port 5051.

HTTP changes are saved atomically to the ignored `mock-be/mock-state.json`; `mock-data.json` remains the seed. `MOCK_DATA_FILE` can select a different state file. Browser and HTTP state are independent. To reset, stop the HTTP server and remove its state file, or remove the browser's `meeplehub-mock-v1` local-storage entry and reload.

## Demo accounts

| Email               | Password   | Access                             |
| ------------------- | ---------- | ---------------------------------- |
| `admin@example.com` | `password` | App administrator                  |
| `nika@example.com`  | `password` | Administrator of clubs 456 and 462 |
| `ana@example.com`   | `password` | Player                             |
| `luka@example.com`  | `password` | Player                             |

New accounts and changed passwords follow the real API's password rules. Tokens expire after one hour, identify the requesting user, and carry roles derived from club membership. After creating a club, sign in again to obtain the ClubAdmin claim, as with the backend.

Fresh fixture tournament dates are relative to the initialization time so registration can be tested. Saved dates never move. Lifecycle transitions run when requests arrive, covering Published → RegistrationOpen → RegistrationClosed → InProgress → Finished. Counts come from actual accepted registrations.

## Implemented contracts

- Authentication, current profile, password change, forgot/reset password.
- User registration, search, self profile edits/deactivation, administrator listing/status changes, and managed clubs.
- Board-game catalog, categories, filtering, sorting, pagination, BGG lookup/search and imports.
- Club creation/approval, public and managed views, edits, inventory additions/removals, and status transitions.
- Tournament creation/editing/publishing/cancellation, public and administrator lists, details, registration, waitlists, promotion, cancellation deadlines, and personal registrations.
- Matching DTO field names and numeric tournament enums, authorization failures, validation errors, missing-resource errors, and empty 204 responses.

Unsupported paths fail explicitly instead of returning unrelated data or pretending a write succeeded.

## Deliberate local substitutes

BGG search, details and imports use the four seeded game fixtures; they do not contact BGG or read the backend CSV. Import counts reflect the fixtures actually processed. Password-reset tokens are available in the local state (`passwordResetTokens`) instead of email delivery. Tokens/passwords are development fixtures, not production authentication.

Leaderboards, staff and notification fixtures are retained for existing frontend features; the supplied backend has no matching controllers yet. The leaderboard client already uses fixture data even in real-API mode. These features cannot be claimed as backend parity until those endpoints exist.

## Verify

```sh
npm run test:mock
npm test -- --run
npm run lint
npm run build
```

The regression suite exercises account isolation, refresh/restart persistence, permissions, club approval/inventory, tournament transitions and capacity, FIFO waitlist promotion, DTO adapters, HTTP/browser response parity, CORS, malformed JSON, and UI-sized image payloads. Test servers use isolated in-memory state and ephemeral ports.
