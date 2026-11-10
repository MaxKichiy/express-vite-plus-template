import { LogRepository } from "#src/core/interfaces/log.repository";
import { Prisma } from "#src/generated/prisma/client";

export class PrismaLogRepository implements LogRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async create(userId: string, message: string) {
    return await this.db.log.create({
      data: {
        userId,
        message,
      },
    });
  }

  async findByUserId(userId: string) {
    return await this.db.log.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }
}
