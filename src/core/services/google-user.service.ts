import { Prisma, GoogleUser } from "@src/generated/prisma/client";
import { PrismaGoogleUserRepository } from "@src/infrastructure/repositories/prisma-google-user.repository";

export class GoogleUserService {
  constructor(
    private readonly googleUserRepository: PrismaGoogleUserRepository,
  ) {}

  async create(
    userId: string,
    googleUser: Omit<Prisma.GoogleUserCreateInput, "user">,
  ): Promise<GoogleUser> {
    return await this.googleUserRepository.create({
      ...googleUser,
      user: {
        connect: {
          id: userId,
        },
      },
    });
  }

  async findByEmail(email: string): Promise<GoogleUser | null> {
    return await this.googleUserRepository.findOneByEmail(email);
  }

  async update(
    id: string,
    data: Prisma.GoogleUserUpdateInput,
  ): Promise<GoogleUser> {
    return await this.googleUserRepository.update(id, data);
  }

  async findGoogleUserByUserId(userId: string): Promise<GoogleUser | null> {
    return await this.googleUserRepository.findGoogleUserByUserId(userId);
  }
}
