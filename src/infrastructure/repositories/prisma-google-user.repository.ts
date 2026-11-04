import {
  GoogleUser,
  IGoogleUserRepository,
  NewGoogleUser,
} from "#src/core/interfaces/IGoogleUserRepository";
import { Prisma } from "#src/generated/prisma/client";

export class PrismaGoogleUserRepository implements IGoogleUserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findGoogleUserByUserId(userId: string): Promise<GoogleUser | null> {
    return await this.db.googleUser.findUnique({
      where: {
        userId,
      },
    });
  }

  async create(googleUser: NewGoogleUser): Promise<GoogleUser> {
    return await this.db.googleUser.create({ data: googleUser });
  }
}
