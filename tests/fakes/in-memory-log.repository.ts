import { ILogRepository, Log } from "#src/core/interfaces/ILogRepository";
import { randomUUID } from "crypto";

export class InMemoryLogRepository implements ILogRepository {
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

  get all(): readonly Log[] {
    return [...this.logs];
  }
}
