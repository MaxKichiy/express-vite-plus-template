import { prisma } from "@src/infrastructure/database/prisma";
import { GoogleUser, Prisma } from "../generated/prisma/client";

export class GoogleUserRepository {
  async findOneByEmail(
    email: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser | null> {
    return await tx.googleUser.findUnique({
      where: {
        email,
      },
    });
  }

  async findGoogleUserByUserId(
    userId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser | null> {
    return await tx.googleUser.findUnique({
      where: {
        userId,
      },
    });
  }

  async create(
    googleUser: Prisma.GoogleUserCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser> {
    return await tx.googleUser.create({ data: googleUser });
  }

  async update(
    id: string,
    data: Prisma.GoogleUserUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser> {
    return await tx.googleUser.update({
      data,
      where: {
        id,
      },
    });
  }
}
