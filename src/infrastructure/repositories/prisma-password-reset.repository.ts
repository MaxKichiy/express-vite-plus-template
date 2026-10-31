import { env } from "@src/env";
import { IPasswordResetsRepository } from "@src/core/interfaces/IPasswordResetsRepository";
import { Prisma } from "@src/generated/prisma/client";

export class PrismaPasswordResetRepository implements IPasswordResetsRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}
  async create(userId: string) {
    return await this.db.passwordReset.create({
      data: {
        expiresAt: new Date(Date.now() + env.PASSWORD_RESET_EXPIRE),
        userId,
      },
    });
  }

  async expire(id: string) {
    return await this.db.passwordReset.update({
      data: {
        expiresAt: new Date(0),
      },
      where: {
        id,
      },
    });
  }

  async find(token: string) {
    return await this.db.passwordReset.findUnique({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        token,
      },
    });
  }
}
