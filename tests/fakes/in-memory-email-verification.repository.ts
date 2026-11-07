import {
  EmailVerification,
  IEmailVerificationRepository,
} from "#src/core/interfaces/IEmailVerification";
import { randomUUID } from "crypto";
import { assertUnique } from "./assert-unique";

const ONE_DAY = 24 * 60 * 60 * 1000;

export class InMemoryEmailVerificationRepository implements IEmailVerificationRepository {
  private rows: EmailVerification[] = [];
  constructor(private readonly ttlMs = ONE_DAY) {}

  async create(userId: string, token: string) {
    assertUnique(this.rows, { token }, ["token"]);
    const now = new Date();
    const row = {
      id: randomUUID(),
      userId,
      token,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + this.ttlMs),
    };

    this.rows.push(row);
    return { ...row };
  }

  async expireForUser(userId: string) {
    let count = 0;
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rows[i]?.userId === userId) {
        count++;
        this.rows[i]!.expiresAt = new Date(0);
      }
    }
    return { count };
  }

  async findValidForUser(userId: string, token: string) {
    const currentVerification = this.rows.find(
      (v) =>
        v.userId == userId && v.token === token && v.expiresAt > new Date(),
    );

    return currentVerification ? { ...currentVerification } : null;
  }

  get all(): readonly EmailVerification[] {
    return [...this.rows];
  }
}
