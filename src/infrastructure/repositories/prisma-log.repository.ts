import { ILogRepository } from "@src/core/interfaces/ILogRepository";
import { Prisma } from "@src/generated/prisma/client";

export class PrismaLogRepository implements ILogRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async create(userId: string, message: string) {
    return await this.db.log.create({
      data: {
        userId,
        message,
      },
    });
  }
}
