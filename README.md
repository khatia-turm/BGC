# MeepleHub Frontend

## Current project status

### Implemented

#### Home — `/`

- Responsive hero introducing MeepleHub.
- Primary registration CTA and secondary events CTA.
- Decorative board-game card visual.
- Upcoming tournament preview row populated from the mock API.
- Featured club preview row populated from the mock API.
- Links to the full tournament and club directories.
- Loading, error, and empty states for preview data.

#### Tournament directory — `/tournaments`

- Search by tournament name, board game, club, or city.
- Filter by board game and host club.
- Filter by any date, upcoming events, this week, or this month.
- Chronologically sorted results.
- Capacity display for each tournament.
- Context-sensitive CTA:
  - `Register` when space is available;
  - `Join waitlist` when the tournament is full.
- Entire tournament card links to its details page.
- Responsive card grid with loading, error, and empty states.

#### Tournament details — `/tournaments/:id`

- Tournament description, type, and registration status.
- Start and end date/time.
- Venue, city, board game, and host club.
- Player capacity and visual progress indicator.
- Registration deadline.
- Registration or waitlist CTA based on capacity.
- Back navigation to the tournament directory.

#### Club directory — `/clubs`

- Search by club name, city, or address.
- City filter generated from available club data.
- Active-club result count.
- Reusable responsive club cards.
- Loading, error, and empty states.

#### Club details — `/clubs/:clubId`

- Public club profile and description.
- Address, working hours, email, and phone.
- Club navigation between overview, games, tournaments, and leaderboards.
- Preview of games available at the club.
- Preview of tournaments hosted by the club.

#### Club game library — `/clubs/:clubId/games`

- Displays games physically available at the selected club.
- Search within the club's game inventory.
- Reusable game cards.

#### Club tournaments — `/clubs/:clubId/tournaments`

- Displays tournaments hosted by the selected club.
- Links to tournament details.
- Uses the shared tournament-card presentation.

#### Club leaderboard — `/clubs/:clubId/leaderboards`

- Requires a specific board game selection.
- Filters rankings by season.
- Ranks players using results from tournaments hosted by the selected club.
- Displays rank, player, rating points, games played, and wins.
- Does not assume that players are members of the club.

#### Platform leaderboard — `/leaderboards`

- Requires a specific board game selection.
- Filters rankings by season.
- Aggregates results from tournaments hosted by every club.
- Top-three player podium.
- Complete ranking table with rating points, tournaments played, wins, and best finish.
- Links ranked players to their public profiles.

#### Player directory — `/players`

- Search by nickname, first name, or last name.
- Public-safe player API response that excludes private account fields.
- Responsive player cards.
- Result count and live searching indicator.
- Loading, error, and empty states.

#### Public player profile — `/players/:playerId`

- Avatar, nickname, and public name.
- MeepleHub join date.
- Current-season rating points, tournaments played, wins, and best finish.
- Rankings grouped by board game and season.
- Recent public tournament activity.
- Links from tournament activity to tournament details.
- No email, phone, birthday, admin note, or authentication data is exposed.

#### Shared application functionality

- Responsive public navigation with active-route styling.
- Reusable MeepleHub logo and dark teal design system.
- Georgian and English translations using i18next.
- Floating language switcher with persisted language selection.
- React Router route groups and layouts for public, player, club-admin, and app-admin areas.
- Typed entity models and API functions.
- TanStack Query caching, request deduplication, and server-state handling.
- API client that switches between local mock data and a real backend.
- Connected mock data for clubs, games, tournaments, players, and leaderboards.
- Reusable club, game, tournament, and player cards.

## Running the project

Requirements:

- Node.js compatible with Vite 8
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

On Windows PowerShell systems where script execution blocks `npm.ps1`, use `npm.cmd`, for example:

```powershell
npm.cmd run dev
```

## Environment configuration

Copy `.env.example` to `.env` when custom values are needed:

```env
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK_API=true
```

`VITE_USE_MOCK_API` defaults to enabled unless it is explicitly set to `false`.

For local frontend development:

```env
VITE_USE_MOCK_API=true
```

For a real backend:

```env
VITE_API_URL=https://api.example.com
VITE_USE_MOCK_API=false
```

Pages call the same entity API functions in both modes, so switching from mock data to the backend should not require page-level rewrites.

## Architecture

The source is organized by responsibility:

```text
src/
  app/                 Application composition, providers, layouts, routes
  entities/            Domain types, API functions, reusable entity UI
  pages/               Route-level screens and page-specific components/hooks
  shared/              API client, configuration, i18n, assets, styles, shared UI
  widgets/             Larger reusable page sections such as public navigation
mock-be/
  mock-data.json       Connected local development data
```

### Application layer

`src/app` owns global composition:

- `AppProviders` combines router and query providers.
- `QueryProvider` creates the shared TanStack Query cache.
- `RouterProvider` mounts the application router.
- Route groups separate public, player, club-admin, and app-admin areas.
- Layouts are shells for navigation, sidebars, authorization, and outlets.

### Entity layer

Each implemented domain keeps its reusable contracts together:

```text
entities/club/
  api/
  model/types.ts
  ui/ClubCard.tsx
```

Implemented entities include:

- club;
- game;
- tournament;
- leaderboard;
- player;
- user.

Pages consume entity hooks and components rather than reading mock JSON directly.

### Page-specific logic

Complex page behavior is extracted from route components. Examples:

- `useTournamentFilters` owns tournament filtering rules.
- `TournamentFilters` renders tournament filter controls.
- `TournamentResults` renders tournament result states.
- `useLeaderboardPage` owns leaderboard selection and queries.
- `usePlayerSearch` owns public player search state.

The route page remains a composition layer instead of containing every rule and UI detail.

## API and server-state flow

The generic API client lives in `src/shared/api/client.ts`.

```text
Page
  -> entity query hook
  -> entity API function
  -> apiClient('/api/...')
  -> mock adapter or real fetch
  -> TanStack Query cache
  -> component render
```

TanStack Query manages server state, including:

- loading and error states;
- caching by query key;
- request deduplication;
- stale-data behavior;
- refetching when filters change.

Local UI state such as search input and selected filters stays in React hooks.

The real API client automatically attaches an `Authorization: Bearer ...` header when `authToken` exists in local storage. Authentication itself is not implemented yet.

## Mock API

The mock adapter is implemented in `src/shared/api/mockApi.ts`. It accepts the same paths used by the future backend and reads from `mock-be/mock-data.json`. A small artificial delay is included so loading states can be tested.

Currently supported read endpoints include:

```text
GET /api/auth/me
GET /api/users
GET /api/users/:id
GET /api/users/:id/clubs

GET /api/players?search=...
GET /api/players/:id

GET /api/games
GET /api/games/:id
GET /api/games/categories

GET /api/clubs
GET /api/clubs/:id
GET /api/clubs/:id/dashboard
GET /api/clubs/:id/games
GET /api/clubs/:id/leaderboards

GET /api/tournaments
GET /api/tournaments/:id

GET /api/leaderboards
```

The mock API currently supports only `GET`. Other methods intentionally return a `501` mock error until mutations are implemented.

### Mock data contents

The dataset currently includes:

- 6 users;
- 4 public clubs;
- 4 board games and 5 categories;
- 5 tournaments;
- tournament registrations, stages, rounds, and one match example;
- club-scoped leaderboard entries;
- platform-wide leaderboard entries.

IDs are connected across records so cards, filters, and detail routes can resolve related games and clubs.

## Public player privacy

The user/account API shape contains private fields such as email and phone. Public player pages do not use that shape.

`/api/players` returns a separate public-safe DTO containing only:

- ID;
- nickname;
- public first and last name;
- avatar URL;
- join date.

The player-profile response additionally contains derived public competition statistics, rankings, and tournament activity. It does not expose email, phone, birthday, status notes, or authentication data.

Placeholder avatars currently use `i.pravatar.cc`. Production avatars should come from backend-managed file storage.

## Leaderboard rules

There are two distinct scopes.

### Club leaderboard

```text
selected club
+ selected board game
+ selected season
+ results from tournaments hosted by that club
= club leaderboard
```

Endpoint example:

```text
GET /api/clubs/456/leaderboards?gameId=13&season=2026
```

### Platform leaderboard

```text
selected board game
+ selected season
+ results from tournaments hosted by every club
= platform leaderboard
```

Endpoint example:

```text
GET /api/leaderboards?gameId=13&season=2026
```

Players do not need to be members of a club for their results to appear. The hosting club is determined by the tournament, not by player membership.

The mock API currently returns already-calculated rank and rating points. A real backend should calculate these values from completed tournament and match results.

## Public routes

| Route                         | Status                            |
| ----------------------------- | --------------------------------- |
| `/`                           | Implemented home page             |
| `/tournaments`                | Implemented tournament directory  |
| `/tournaments/:id`            | Implemented tournament details    |
| `/clubs`                      | Implemented club directory        |
| `/clubs/:clubId`              | Implemented club details          |
| `/clubs/:clubId/games`        | Implemented club game library     |
| `/clubs/:clubId/tournaments`  | Implemented hosted tournaments    |
| `/clubs/:clubId/leaderboards` | Implemented club leaderboard      |
| `/leaderboards`               | Implemented platform leaderboard  |
| `/players`                    | Implemented player directory      |
| `/players/:playerId`          | Implemented public player profile |
| `/games`                      | Placeholder                       |
| `/games/:gameId`              | Placeholder                       |
| `/login`                      | Placeholder                       |
| `/register`                   | Placeholder                       |
| `/register/club`              | Placeholder                       |

Player, club-admin, and app-admin route trees are registered but currently contain placeholder pages

## next

1. Implement the games directory and details page using the existing game entity API and `GameCard`.
2. Define authentication behavior and protected-route guards.
3. Implement login and registration forms.
4. Add tournament registration/waitlist mutations and cache invalidation.
5. Replace provisional mock shapes with confirmed backend DTOs.
6. Implement authenticated player pages.
7. Build club-admin dashboard and tournament-management workflows.
8. Add unit/component tests for filters, API adapters, and critical pages.
9. Add form validation and accessible error summaries.
10. Optimize production assets, including the current large logo PNG
