import { env } from "#src/config/env";
import {
  EmailVerification,
  IEmailVerificationRepository,
} from "#src/core/interfaces/IEmailVerification";
import { randomUUID } from "crypto";

export class InMemoryEmailVerificationRepository implements IEmailVerificationRepository {
  constructor(private emailVerifications: EmailVerification[] = []) {}

  async create(userId: string, token: string) {
    const now = new Date();
    const newVerification = {
      id: randomUUID(),
      userId,
      token,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRE),
    };

    this.emailVerifications.push(newVerification);
    return newVerification;
  }

  async deleteById(id: string) {
    const currentVerification = this.emailVerifications.find(
      (v) => v.id === id,
    );

    if (!currentVerification) throw new Error("record not found");

    this.emailVerifications = this.emailVerifications.filter(
      (v) => v.id !== id,
    );

    return currentVerification;
  }

  async expireForUser(userId: string) {
    let count = 0;
    for (let i = 0; i < this.emailVerifications.length; i++) {
      if (this.emailVerifications[i]?.userId === userId) {
        count++;
        this.emailVerifications[i]!.expiresAt = new Date(0);
      }
    }
    return { count };
  }

  async findValidForUser(userId: string, token: string) {
    const currentVerification = this.emailVerifications.find(
      (v) =>
        v.userId == userId && v.token === token && v.expiresAt > new Date(),
    );

    if (!currentVerification) throw new Error("record not found");

    return currentVerification;
  }
}
