export type ClubStatus = "Pending" | "Active" | "Rejected" | "Suspended" | "Deleted";

export type Club = {
  id: number;
  name: string;
  logoUrl: string;
  description: string | null;
  address: string;
  city: string;
  email: string | null;
  phone: string | null;
  workingHours: string | null;
  status: ClubStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ClubDashboard = {
  clubId: number;
  pendingMembers: number;
  upcomingTournaments: number;
  totalPlayers: number;
};
