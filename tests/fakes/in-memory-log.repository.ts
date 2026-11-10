import { LogRepository, Log } from "#src/core/interfaces/log.repository";
import { randomUUID } from "crypto";

export class InMemoryLogRepository implements LogRepository {
  constructor(private logs: Log[] = []) {}

  async create(userId: string, message: string) {
    const id = randomUUID();
    const newLog = {
      userId,
      message,
      id,
    };
    this.logs.push(newLog);
    return newLog;
  }

  async findByUserId(userId: string) {
    return this.logs.filter((l) => l.userId === userId).map((l) => ({ ...l }));
  }

  get all(): readonly Log[] {
    return [...this.logs];
  }
}
