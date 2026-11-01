import {
  GoogleUser,
  GoogleUserUpdate,
  IGoogleUserRepository,
  NewGoogleUser,
} from "../interfaces/IGoogleUserRepository";

export class GoogleUserService {
  constructor(private readonly googleUserRepository: IGoogleUserRepository) {}

  async create(
    userId: string,
    googleUser: Omit<NewGoogleUser, "userId">,
  ): Promise<GoogleUser> {
    return await this.googleUserRepository.create({ ...googleUser, userId });
  }

  async findByEmail(email: string): Promise<GoogleUser | null> {
    return await this.googleUserRepository.findOneByEmail(email);
  }

  async update(id: string, data: GoogleUserUpdate): Promise<GoogleUser> {
    return await this.googleUserRepository.update(id, data);
  }

  async findGoogleUserByUserId(userId: string): Promise<GoogleUser | null> {
    return await this.googleUserRepository.findGoogleUserByUserId(userId);
  }
}
