import { prisma } from "@src/infrastructure/database/prisma";
import { Prisma } from "../generated/prisma/client";

export class UserRepository {
  async create(
    user: Prisma.UserCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.user.create({ data: user });
  }

  async delete(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.user.delete({
      where: {
        id: userId,
      },
    });
  }

  async findByEmail(email: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await tx.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async findByPhone(
    phoneNumber: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.user.findFirst({
      where: {
        phoneNumber,
      },
    });
  }

  async findByEmailWithPassword(
    email: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.user.findUnique({
      where: {
        email,
        passwordHash: {
          not: null,
        },
      },
    });
  }

  async update(
    userId: string,
    data: Prisma.UserUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}
