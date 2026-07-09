import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Club } from "@entities/club/model/types";
import type { Game } from "@entities/game/model/types";
import type { Tournament } from "@entities/tournament/model/types";
import { useTournamentFilters } from "./useTournamentFilters";

const createClub = (overrides: Partial<Club>): Club => ({
  id: 1,
  name: "Meeple House",
  logoUrl: "",
  description: null,
  address: "1 Tabletop Street",
  city: "Tbilisi",
  email: null,
  phone: null,
  workingHours: null,
  status: "Active",
  adminNote: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const createGame = (overrides: Partial<Game>): Game => ({
  id: 1,
  bggId: 1,
  title: "Catan",
  description: "",
  year: 1995,
  minPlayers: 3,
  maxPlayers: 4,
  minPlayerAge: 10,
  suggestedPlayerAge: 10,
  minPlayingTime: 60,
  maxPlayingTime: 90,
  complexity: 2.3,
  type: "Strategy",
  bggOverallRank: 1,
  bggGeekRating: 7,
  bggAvgRating: 7,
  bggVoters: 1000,
  bggCommunityPlayerCounts: {
    best: [4],
    recommended: [3, 4],
    notRecommended: [2],
  },
  imageUrl: "",
  categoryIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const createTournament = (
  overrides: Partial<Tournament>,
): Tournament => ({
  id: 1,
  clubId: 1,
  name: "Catan Open",
  tournamentType: 0,
  status: 1,
  startsAt: "2026-07-12T10:00:00.000Z",
  maxParticipants: 16,
  currentParticipants: 4,
  location: "Main Hall",
  boardGames: [{ boardGameId: 1, title: "Catan", imageUrl: null, year: 1995 }],
  ...overrides,
});

const clubs = [
  createClub({ id: 1, name: "Meeple House" }),
  createClub({ id: 2, name: "Dice Corner" }),
];

const games = [
  createGame({ id: 1, title: "Catan" }),
  createGame({ id: 2, title: "Azul" }),
];

const tournaments = [
  createTournament({
    id: 1,
    clubId: 1,
    name: "Catan Open",
    startsAt: "2026-07-12T10:00:00.000Z",
  }),
  createTournament({
    id: 2,
    clubId: 2,
    name: "Azul Night",
    startsAt: "2026-08-15T10:00:00.000Z",
    location: "Blue Room",
    boardGames: [{ boardGameId: 2, title: "Azul", imageUrl: null, year: 2017 }],
  }),
  createTournament({
    id: 3,
    clubId: 1,
    name: "Past Finals",
    startsAt: "2026-07-01T10:00:00.000Z",
  }),
];

describe("useTournamentFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to upcoming tournaments sorted by start date", () => {
    const { result } = renderHook(() =>
      useTournamentFilters({ tournaments, games, clubs }),
    );

    expect(result.current.filteredTournaments.map((item) => item.id)).toEqual([
      1, 2,
    ]);
  });

  it("filters by board game, club, and search term", () => {
    const { result } = renderHook(() =>
      useTournamentFilters({ tournaments, games, clubs }),
    );

    act(() => {
      result.current.actions.setGameId("2");
      result.current.actions.setClubId("2");
      result.current.actions.setSearch("blue");
    });

    expect(result.current.filteredTournaments).toEqual([tournaments[1]]);
  });

  it("filters tournaments scheduled during the next week", () => {
    const { result } = renderHook(() =>
      useTournamentFilters({ tournaments, games, clubs }),
    );

    act(() => {
      result.current.actions.setDateFilter("week");
    });

    expect(result.current.filteredTournaments).toEqual([tournaments[0]]);
  });

  it("can include past tournaments and sort descending", () => {
    const { result } = renderHook(() =>
      useTournamentFilters({ tournaments, games, clubs }),
    );

    act(() => {
      result.current.actions.setDateFilter("all");
      result.current.actions.setSortOrder("desc");
    });

    expect(result.current.filteredTournaments.map((item) => item.id)).toEqual([
      2, 1, 3,
    ]);
  });
});
