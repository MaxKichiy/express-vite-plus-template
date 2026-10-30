import { prisma } from "@src/infrastructure/database/prisma";
import { Prisma } from "../generated/prisma/client";

export class LogRepository {
  async create(
    userId: string,
    message: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.log.create({
      data: {
        userId,
        message,
      },
    });
  }
}
