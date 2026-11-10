import {
  GoogleUser,
  GoogleUserUpdate,
  GoogleUserRepository,
  NewGoogleUser,
} from "#src/core/interfaces/google-user.repository";
import { randomUUID } from "crypto";
import { assertUnique } from "./assert-unique";

export class InMemoryGoogleUserRepository implements GoogleUserRepository {
  constructor(private googleUsers: GoogleUser[] = []) {}

  async findByGoogleAccountId(googleAccountId: string) {
    return (
      this.googleUsers.find((e) => e.googleAccountId === googleAccountId) ??
      null
    );
  }

  async create(googleUser: NewGoogleUser) {
    assertUnique(this.googleUsers, googleUser, [
      "googleAccountId",
      "userId",
      "email",
    ]);

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

  get all() {
    return [...this.googleUsers];
  }
}
