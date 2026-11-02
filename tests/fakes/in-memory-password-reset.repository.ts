import { env } from "#src/config/env";
import {
  IPasswordResetsRepository,
  PasswordReset,
} from "#src/core/interfaces/IPasswordResetsRepository";
import { randomUUID } from "crypto";
import { read } from "fs";

const ONE_HOUR = 60 * 60 * 1000;

export class InMemoryPasswordResetRepository implements IPasswordResetsRepository {
  private rows: PasswordReset[];
  constructor(
    seed: PasswordReset[] = [],
    private readonly ttlMs = ONE_HOUR,
  ) {
    this.rows = [...seed];
  }

  async create(userId: string) {
    const now = new Date();

    const row = {
      id: randomUUID(),
      userId,
      token: randomUUID(),
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + this.ttlMs),
    };

    this.rows.push(row);

    return { ...row };
  }
  async expire(id: string) {
    const i = this.rows.findIndex((p) => p.id === id);
    if (i === -1) throw new Error("record not found");

    this.rows[i] = {
      ...this.rows[i]!,
      expiresAt: new Date(0),
      updatedAt: new Date(),
    };

    return { ...this.rows[i] };
  }
  async find(token: string) {
    const row = this.rows.find(
      (p) => p.token === token && p.expiresAt > new Date(),
    );
    return row ? { ...row } : null;
  }

  get all(): readonly PasswordReset[] {
    return { ...this.rows };
  }
}
