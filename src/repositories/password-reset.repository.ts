import { prisma } from "@src/infrastructure/database/prisma";
import { env } from "../env";
import { Prisma } from "../generated/prisma/client";

export class PasswordResetRepository {
  async create(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.passwordReset.create({
      data: {
        expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRE),
        userId,
      },
    });
  }

  async expire(id: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.passwordReset.update({
      data: {
        expiresAt: new Date(0),
      },
      where: {
        id,
      },
    });
  }

  async find(token: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.passwordReset.findUnique({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        token,
      },
    });
  }
}
