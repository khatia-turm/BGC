import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Club } from "@entities/club/model/types";
import { useClubFilters } from "./useClubFilters";

const createClub = (overrides: Partial<Club>): Club => ({
  id: 1,
  name: "Meeple House",
  logoUrl: "",
  description: "Friendly board game club",
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

const clubs = [
  createClub({ id: 1, name: "Meeple House", city: "Tbilisi" }),
  createClub({
    id: 2,
    name: "Dice Corner",
    city: "Batumi",
    address: "Seaside Avenue",
  }),
  createClub({
    id: 3,
    name: "Strategy Loft",
    city: "Tbilisi",
    description: "Heavy games every weekend",
  }),
];

describe("useClubFilters", () => {
  it("returns sorted unique city options", () => {
    const { result } = renderHook(() => useClubFilters(clubs));

    expect(result.current.cities).toEqual(["Batumi", "Tbilisi"]);
  });

  it("filters clubs by city and search term", () => {
    const { result } = renderHook(() => useClubFilters(clubs));

    act(() => {
      result.current.setCity("Tbilisi");
      result.current.setSearch("heavy");
    });

    expect(result.current.filteredClubs).toEqual([clubs[2]]);
  });

  it("matches search terms across name, city, address, and description", () => {
    const { result } = renderHook(() => useClubFilters(clubs));

    act(() => {
      result.current.setSearch("seaside");
    });

    expect(result.current.filteredClubs).toEqual([clubs[1]]);
  });
});
