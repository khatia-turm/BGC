export type Tournament = {
  id: number;
  clubId: number;
  gameId: number;
  name: string;
  description: string;
  type: "League" | "Knockout" | "Multi-stage";
  status: string;
  city: string;
  venue: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  startsAt: string;
  endsAt: string;
  maxPlayers: number;
  registeredPlayers: number;
  entryFee?: number | null;
  waitlistCount?: number;
  scoringPolicy: string;
  tieBreakRules: string[];
  createdAt: string;
  updatedAt: string;
};

export type TournamentParticipant = { id: number; nickname: string; avatarUrl: string | null };

export type TournamentRegistrationStatus = "Accepted" | "Waitlisted";

export type TournamentRegistration = {
  id: number;
  tournamentId: number;
  status: TournamentRegistrationStatus;
  registeredAt: string;
  cancellationClosesAt: string;
};
