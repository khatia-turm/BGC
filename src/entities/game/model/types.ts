export type Game = {
  id: number;
  bggId: number;
  title: string;
  subtitle: string;
  description: string;
  year: number;
  minPlayers: number;
  maxPlayers: number;
  minPlayingTime: number;
  maxPlayingTime: number;
  complexity: number;
  type: string;
  bggOverallRank: number;
  bggGeekRating: number;
  bggAvgRating: number;
  bggVoters: number;
  bggCommunityPlayerCounts: {
    best: number[];
    recommended: number[];
    notRecommended: number[];
  };
  imageUrl: string;
  categoryIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type GameCategory = { id: number; name: string };
