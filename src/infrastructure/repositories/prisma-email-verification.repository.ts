import { IEmailVerificationRepository } from "@src/core/interfaces/IEmailVerification";
import { Prisma } from "@src/generated/prisma/client";
import { env } from "@src/env";

export class PrismaEmailVerificationRepository implements IEmailVerificationRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async create(userId: string, token: string) {
    return await this.db.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRE),
      },
    });
  }

  async deleteById(id: string) {
    return await this.db.emailVerification.delete({
      where: {
        id,
      },
    });
  }

  async expireForUser(userId: string) {
    return await this.db.emailVerification.updateMany({
      where: {
        userId,
      },
      data: {
        expiresAt: new Date(0),
      },
    });
  }

  async findValidForUser(userId: string, token: string) {
    return await this.db.emailVerification.findFirst({
      where: {
        userId,
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }
}
