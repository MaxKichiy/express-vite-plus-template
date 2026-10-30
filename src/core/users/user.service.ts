import { prisma } from "@src/infrastructure/database/prisma";
import { errors } from "../../constants/error.constant";
import { Prisma } from "../../generated/prisma/client";
import { IUserRepository } from "../users/user-repository.port";

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async create(
    user: Prisma.UserCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await this.userRepository.create(user, tx);
  }

  async delete(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await this.userRepository.delete(userId, tx);
  }

  async findByEmail(email: string, tx: Prisma.TransactionClient = prisma) {
    return await this.userRepository.findByEmail(email, tx);
  }

  async findByEmailOrThrow(
    email: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    const user = await this.findByEmail(email, tx);

    if (!user) {
      throw new Error(errors.USER_NOT_FOUND);
    }

    return user;
  }

  async findByEmailWithPassword(
    email: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await this.userRepository.findByEmailWithPassword(email, tx);
  }

  async findById(userId: string, tx: Prisma.TransactionClient = prisma) {
    return await this.userRepository.findById(userId, tx);
  }

  async findByIdOrThrow(userId: string, tx: Prisma.TransactionClient = prisma) {
    const user = await this.findById(userId, tx);

    if (!user) {
      throw new Error(errors.USER_NOT_FOUND);
    }

    return user;
  }

  async update(
    userId: string,
    data: Prisma.UserUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await this.userRepository.update(userId, data, tx);
  }
}
