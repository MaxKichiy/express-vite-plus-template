import {
  GoogleUser,
  GoogleUserUpdate,
  IGoogleUserRepository,
  NewGoogleUser,
} from "#src/core/interfaces/IGoogleUserRepository";
import { randomUUID } from "crypto";

export class InMemoryGoogleUserRepository implements IGoogleUserRepository {
  constructor(private googleUsers: GoogleUser[] = []) {}

  async findOneByEmail(email: string) {
    return this.googleUsers.find((e) => e.email === email) ?? null;
  }

  async findGoogleUserByUserId(userId: string) {
    return this.googleUsers.find((e) => e.userId === userId) ?? null;
  }

  async create(googleUser: NewGoogleUser) {
    const existingUser = this.googleUsers.find(
      (u) => u.googleAccountId === googleUser.googleAccountId,
    );
    if (existingUser) throw new Error("unique constraint: google id");

    const now = new Date();

    const newUser: GoogleUser = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      emailVerified: false,
      ...googleUser,
    };

    this.googleUsers.push(newUser);

    return newUser;
  }

  async update(id: string, data: GoogleUserUpdate) {
    const i = this.googleUsers.findIndex((u) => u.id === id);

    if (i === -1) throw new Error("record not found");

    this.googleUsers[i] = {
      ...this.googleUsers[i]!,
      ...data,
      updatedAt: new Date(),
    };

    return this.googleUsers[i];
  }
}
