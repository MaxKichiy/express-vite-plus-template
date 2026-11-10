import { UserRepository } from "#src/core/users/user.repository";
import { NewUser, UserChanges } from "#src/core/users/user";
import { Prisma } from "#src/generated/prisma/client";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async create(user: NewUser) {
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

  async update(userId: string, data: UserChanges) {
    return await this.db.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}
