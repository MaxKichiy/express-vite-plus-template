import { TxContext } from "../interfaces/ITransactionManager";
import type { User, NewUser, UserChanges } from "./user";

export interface IUserRepository {
  create(data: NewUser, tx?: TxContext): Promise<User>;
  update(id: string, data: UserChanges, tx?: TxContext): Promise<User>;
  delete(id: string, tx?: TxContext): Promise<User>;
  findByEmail(email: string, tx?: TxContext): Promise<User | null>;
  findById(id: string, tx?: TxContext): Promise<User | null>;
}
