export type PublicPlayer = {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  joinedAt: string;
};

export type PlayerRanking = {
  gameId: number;
  season: string;
  rank: number;
  ratingPoints: number;
};

export type PlayerTournament = {
  tournamentId: number;
  name: string;
  startsAt: string;
  city: string;
  status: string;
};

export type PublicPlayerProfile = PublicPlayer & {
  stats: {
    ratingPoints: number;
    tournamentsPlayed: number;
    wins: number;
    bestFinish: number | null;
  };
  rankings: PlayerRanking[];
  tournaments: PlayerTournament[];
};
