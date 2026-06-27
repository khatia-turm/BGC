export type UserStatus = "Active" | "Suspended" | "Deleted";
export type Gender = "Male" | "Female" | "Other";

export type User = {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
  birthday: string;
  gender: Gender;
  email: string;
  phone: string;
  avatarUrl: string | null;
  status: UserStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CurrentUser = User & {
  roles: string[];
  clubs: Array<{ id: number; name: string; role: "Admin" | "Moderator" }>;
};
