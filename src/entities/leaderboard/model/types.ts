export type ClubLeaderboardEntry = {
  id: number;
  clubId: number;
  gameId: number;
  season: string;
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  rank: number;
  ratingPoints: number;
  gamesPlayed: number;
  wins: number;
};

export type PlatformLeaderboardEntry = {
  id: number;
  gameId: number;
  season: string;
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  rank: number;
  ratingPoints: number;
  tournamentsPlayed: number;
  wins: number;
  bestFinish: number;
};
