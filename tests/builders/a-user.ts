import { User } from "#src/core/users/user";

export const aUser = (over: Partial<User> = {}): User => ({
  id: "u1",
  role: "USER",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@x.co",
  passwordHash: "hashed:secret",
  emailVerifiedAt: null,
  phoneNumber: null,
  phoneVerifiedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...over,
});
