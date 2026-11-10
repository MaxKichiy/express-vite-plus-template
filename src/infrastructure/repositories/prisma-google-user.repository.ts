import {
  GoogleUser,
  GoogleUserRepository,
  NewGoogleUser,
} from "#src/core/interfaces/google-user.repository";
import { Prisma } from "#src/generated/prisma/client";

export class PrismaGoogleUserRepository implements GoogleUserRepository {
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
