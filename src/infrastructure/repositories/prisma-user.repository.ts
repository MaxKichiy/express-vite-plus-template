import { IUserRepository } from "@src/core/users/IUserRepository";
import { Prisma, User } from "@src/generated/prisma/client";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async create(user: User) {
    return await this.db.user.create({ data: user });
  }

  async findById(userId: string) {
    return await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.db.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async delete(userId: string) {
    return await this.db.user.delete({
      where: {
        id: userId,
      },
    });
  }

  async findByPhone(phoneNumber: string) {
    return await this.db.user.findFirst({
      where: {
        phoneNumber,
      },
    });
  }

  async update(userId: string, data: User) {
    return await this.db.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}
