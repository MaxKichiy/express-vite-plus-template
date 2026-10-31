import { errors } from "../../constants/error.constant";
import { AppError } from "../error";
import { IUserRepository } from "./IUserRepository";
import { NewUser, UserChanges } from "./user";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async create(user: NewUser) {
    return await this.userRepository.create(user);
  }

  async delete(userId: string) {
    return await this.userRepository.delete(userId);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findByEmailOrThrow(email: string) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    return user;
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findByEmailWithPassword(email);
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
