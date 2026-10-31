import type { User, NewUser, UserChanges } from "./user";

export interface IUserRepository {
  create(data: NewUser): Promise<User>;
  update(id: string, data: UserChanges): Promise<User>;
  delete(id: string): Promise<User>;
  findByEmail(email?: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
