import { prisma } from "@src/infrastructure/database/prisma";
import { Prisma, GoogleUser } from "@src/generated/prisma/client";
import { GoogleUserRepository } from "@src/repositories/google-user.repository";

export class GoogleUserService {
  private readonly googleUserRepository: GoogleUserRepository =
    new GoogleUserRepository();

  async create(
    userId: string,
    googleUser: Omit<Prisma.GoogleUserCreateInput, "user">,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser> {
    return await this.googleUserRepository.create(
      {
        ...googleUser,
        user: {
          connect: {
            id: userId,
          },
        },
      },
      tx,
    );
  }

  async findByEmail(
    email: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser | null> {
    return await this.googleUserRepository.findOneByEmail(email, tx);
  }

  async update(
    id: string,
    data: Prisma.GoogleUserUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<GoogleUser> {
    return await this.googleUserRepository.update(id, data, tx);
  }
}
