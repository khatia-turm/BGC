export type TournamentType = 0 | 1 | 2;
export type TournamentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TournamentRegistrationStatus = 0 | 1 | 2;

export type TournamentBoardGame = {
  boardGameId: number;
  title: string;
  imageUrl: string | null;
  year: number | null;
};

export type TournamentMyRegistration = {
  registrationId: number;
  status: TournamentRegistrationStatus;
  waitlistPosition: number | null;
  registeredAt: string;
};

export type Tournament = {
  id: number;
  clubId: number;
  clubName?: string;
  name: string;
  description?: string | null;
  tournamentType: TournamentType;
  status: TournamentStatus;
  startsAt: string;
  endsAt?: string | null;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  cancellationDeadline?: string | null;
  minParticipants?: number;
  maxParticipants: number;
  currentParticipants: number;
  location?: string | null;
  entryFee?: number | null;
  boardGames?: TournamentBoardGame[];
  myRegistration?: TournamentMyRegistration | null;
  createdAt?: string;
};

export type TournamentParticipant = {
  registrationId: number;
  status: TournamentRegistrationStatus;
  waitlistPosition: number | null;
  registeredAt: string;
  user: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type TournamentRegistration = {
  id: number;
  tournamentId: number;
  userId: number;
  status: TournamentRegistrationStatus;
  waitlistPosition: number | null;
  createdAt: string;
};

export type MyTournamentRegistration = {
  registrationId: number;
  tournamentId: number;
  tournamentName: string;
  clubId: number;
  clubName: string;
  status: TournamentRegistrationStatus;
  waitlistPosition: number | null;
  tournamentStartsAt: string;
  tournamentEndsAt?: string | null;
  location?: string | null;
  entryFee?: number | null;
  registeredAt: string;
};

export const getTournamentTypeLabel = (type: TournamentType) =>
  (["League", "Knockout", "Multi-stage"] as const)[type] ?? "Tournament";

export const getTournamentStatusLabel = (status: TournamentStatus) =>
  (
    [
      "Draft",
      "Published",
      "Registration Open",
      "Registration Closed",
      "In Progress",
      "Finished",
      "Cancelled",
    ] as const
  )[status] ?? "Tournament";

export const getRegistrationStatusLabel = (
  status: TournamentRegistrationStatus,
) => (["Accepted", "Waitlisted", "Cancelled"] as const)[status] ?? "Accepted";
