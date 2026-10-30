import { prisma } from "@src/infrastructure/database/prisma";
import { env } from "../env";
import { Prisma } from "../generated/prisma/client";

export class EmailVerificationRepository {
  async create(
    userId: string,
    token: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRE),
      },
    });
  }

  async deleteById(id: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.emailVerification.delete({
      where: {
        id,
      },
    });
  }

  async expireForUser(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.emailVerification.updateMany({
      where: {
        userId,
      },
      data: {
        expiresAt: new Date(0),
      },
    });
  }

  async findValidForUser(
    userId: string,
    token: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.emailVerification.findFirst({
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
