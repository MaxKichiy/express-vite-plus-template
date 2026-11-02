import { IUserRepository } from "#src/core/users/IUserRepository";
import { NewUser, User, UserChanges } from "#src/core/users/user";
import { randomUUID } from "crypto";

function definedOnly<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  ) as T;
}

export class InMemoryUserRepository implements IUserRepository {
  constructor(private users: User[] = []) {}

  async create(data: NewUser) {
    if (this.users.some((u) => u.email === data.email)) {
      throw new Error("unique contraint: email");
    }

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      role: "USER",
      phoneNumber: null,
      passwordHash: null,
      emailVerifiedAt: null,
      phoneVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
      ...definedOnly(data),
    };

    this.users.push(user);
    return user;
  }
  async update(id: string, data: UserChanges) {
    const i = this.users.findIndex((u) => u.id === id);
    if (i === -1) throw new Error("record not found");
    this.users[i] = {
      ...this.users[i]!,
      ...definedOnly(data),
      updatedAt: new Date(),
    };
    return this.users[i];
  }
  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) throw new Error("record not found");
    this.users = this.users.filter((u) => u.id !== id);
    return user;
  }
  async findByEmail(email?: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
}
