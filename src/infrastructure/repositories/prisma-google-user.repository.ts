import {
  GoogleUser,
  IGoogleUserRepository,
  NewGoogleUser,
} from "#src/core/interfaces/IGoogleUserRepository";
import { Prisma } from "#src/generated/prisma/client";

export class PrismaGoogleUserRepository implements IGoogleUserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findByGoogleAccountId(
    googleAccountId: string,
  ): Promise<GoogleUser | null> {
    return await this.db.googleUser.findUnique({
      where: {
        googleAccountId,
      },
    });
  }

  async create(googleUser: NewGoogleUser): Promise<GoogleUser> {
    return await this.db.googleUser.create({ data: googleUser });
  }
}
