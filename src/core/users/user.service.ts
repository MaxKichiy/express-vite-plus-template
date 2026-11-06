import { AppError } from "../error";
import { IUserRepository } from "./IUserRepository";
import { UserChanges } from "./user";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findById(userId: string) {
    return await this.userRepository.findById(userId);
  }

  async findByIdOrThrow(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    return user;
  }

  async update(userId: string, data: UserChanges) {
    return await this.userRepository.update(userId, data);
  }
}
