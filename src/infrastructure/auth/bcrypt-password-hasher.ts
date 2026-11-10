import { PasswordHasher } from "#src/core/interfaces/password-hasher";
import bcryptjs from "bcryptjs";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly salt: number = 12;

  constructor() {}

  async hash(password: string) {
    return await bcryptjs.hash(password, this.salt);
  }

  async compare(password: string, hash: string) {
    return await bcryptjs.compare(password, hash);
  }
}
