import {
  GoogleUser,
  GoogleUserUpdate,
  IGoogleUserRepository,
  NewGoogleUser,
} from "@src/core/interfaces/IGoogleUserRepository";
import { Prisma } from "@src/generated/prisma/client";

export class PrismaGoogleUserRepository implements IGoogleUserRepository {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async findOneByEmail(email: string): Promise<GoogleUser | null> {
    return await this.db.googleUser.findUnique({
      where: {
        email,
      },
    });
  }

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

  async update(id: string, data: GoogleUserUpdate): Promise<GoogleUser> {
    return await this.db.googleUser.update({
      data,
      where: {
        id,
      },
    });
  }
}
