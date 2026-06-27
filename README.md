# Frontend Execution Plan

---

## Week 1 — Public and Player Pages

### Day 1 — Project Setup

- Create React + TypeScript + Vite project
- Install required dependencies
- Set up routing
- Set up folder structure
- Set up mock data/services
- Create base layouts:
  - Public layout
  - Player layout
  - Club admin layout
  - App admin layout

### Day 2 — Shared UI Components

Create reusable components:

- Button
- Input
- Select
- Card
- Badge
- Tabs
- Modal
- Table
- PageHeader
- EmptyState
- LoadingState

### Day 3 — Tournament Flow

Build:

- `/tournaments`
- `/tournaments/:id`

Include:

- tournament cards
- filters
- tournament details
- register/waitlist UI states
- registration confirmation modal

### Day 4 — Clubs and Games

Build:

- `/clubs`
- `/clubs/:clubId`
- `/games`
- `/games/:gameId`

Include:

- club cards
- club profile tabs
- game cards
- related tournaments
- related clubs

### Day 5 — Leaderboards and Players

Build:

- `/leaderboards`
- `/players`
- `/players/:playerId`

Include:

- platform-wide leaderboard
- club-specific leaderboard mode
- player search
- public player profile

### Day 6 — Player Area

Build:

- `/me/events`
- `/me/profile`
- `/me/stats`
- `/me/history`
- `/me/notifications`

Include:

- upcoming/waitlisted/past/cancelled events
- profile edit form
- stats table
- history table
- notifications list

### Day 7 — Week 1 Cleanup

- Fix navigation links
- Add active navigation states
- Add empty states
- Add loading states
- Make public/player pages visually consistent

---

## Week 2 — Admin Pages

### Day 8 — Club Admin Dashboard

Build:

- `/club-admin/:clubId`
- `/club-admin/:clubId/tournaments`

Include:

- club admin sidebar
- dashboard cards
- tournament table
- tournament status filters

### Day 9 — Tournament Builder

Build:

- `/club-admin/:clubId/tournaments/new`

Include stepper:

- Basic Info
- Registration Settings
- Tournament Type
- Stage Builder
- Scoring Policy
- Tie-break Rules
- Review & Publish

### Day 10 — Manage Tournament Shell

Build:

- `/club-admin/:clubId/tournaments/:tournamentId`

Add tabs:

- Overview
- Registrations
- Waitlist
- Participants
- Check-in
- Structure
- Rounds & Tables
- Results
- Standings
- Messages
- Settings

### Day 11 — Core Tournament Management Tabs

Implement:

- Registrations tab
- Waitlist tab
- Participants tab
- Check-in tab
- Rounds & Tables tab
- Results tab
- Standings tab

Use mock data and basic UI actions.

### Day 12 — Club Admin Extra Pages

Build:

- `/club-admin/:clubId/games`
- `/club-admin/:clubId/staff`
- `/club-admin/:clubId/profile/edit`

Include:

- game inventory table
- add game modal
- staff table
- club profile edit form

### Day 13 — App Admin Pages

Build:

- `/admin`
- `/admin/club-requests`
- `/admin/clubs`
- `/admin/users`

Include:

- pending club requests
- approve/reject UI
- clubs table
- users table
- status badges

### Day 14 — Final Cleanup

- Fix route consistency
- Check all navigation
- Add missing empty/loading/error states
- Replace hardcoded arrays with mock service functions
- Check basic responsiveness
- Prepare API integration checklist

---

## Must Be Done Before Backend Integration

- All major routes exist
- Navigation works
- Mock data is displayed through service functions
- Pages are not using hardcoded inline arrays directly
- Forms have basic validation
- Tabs, modals, tables, and cards work
- Loading, empty, and error states exist
- Route structure matches documentation

---

## Cut From Two-Week Scope

Postpone:

- Real authentication
- Real API integration
- Full mobile polish
- Advanced scoring logic
- Real notification delivery
- Drag-and-drop stage builder
- Result dispute system
- Payment system
- Club posts
- Open play
- Memberships

---

## Priority Order

1. Routing and layouts
2. Shared components
3. Tournament list/details
4. Club pages
5. Leaderboards
6. Player pages
7. Club admin dashboard
8. Tournament builder
9. Manage tournament tabs
10. App admin pages
11. Cleanup and API readiness
