export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: Date | null;
  phoneNumber: string | null;
  phoneVerifiedAt: Date | null;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, "firstName" | "lastName" | "email"> &
  Partial<
    Pick<User, "role" | "phoneNumber" | "passwordHash" | "emailVerifiedAt">
  >;
