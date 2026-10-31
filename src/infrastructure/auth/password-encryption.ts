import { IPasswordEncryption } from "@src/core/interfaces/IPasswordEncryption";
import bcryptjs from "bcryptjs";

export class PasswordEncryption implements IPasswordEncryption {
  private readonly salt: number = 12;

  constructor() {}

  async hash(password: string) {
    return await bcryptjs.hash(password, this.salt);
  }

  async compare(password: string, hash: string) {
    return await bcryptjs.compare(password, hash);
  }
}
