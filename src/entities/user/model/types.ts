export type UserStatus = "Active" | "Suspended" | "Deleted";
export type Gender = "Male" | "Female" | "Other";
export type UserClubRole = "Admin" | "Moderator";

export type ManagedClub = {
  id: number;
  name: string;
  role: UserClubRole;
  logoUrl?: string;
  description?: string;
  address?: string;
  city?: string;
  email?: string;
  phone?: string;
  workingHours?: string;
};

export type CurrentUser = {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string;
  clubs: ManagedClub[];
};

export type UserListItem = {
  id: number;
  nickname: string;
  email: string;
  status: UserStatus;
  createdAt: string;
};

export type UserPublicProfile = {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
};

export type UserDetail = UserPublicProfile & {
  birthday: string;
  gender: Gender;
  phone: string;
  status: UserStatus;
  updatedAt: string;
};

export type UserProfile = UserPublicProfile | UserDetail;

export type PaginatedUsers = {
  items: UserListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type UpdateUserPayload = Partial<{
  nickname: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: 0 | 1 | 2;
  phone: string;
  avatarUrl: string | null;
}>;
