import { AppError } from "../error";
import { PasswordHasher } from "../interfaces/password-hasher";
import { LogService } from "../services/log.service";
import { TokenService } from "../services/token.service";
import { UserRepository } from "../users/user.repository";

const DUMMY_HASH =
  "$2a$12$3QVjUBkcvlN7GlaOmuqyEe9U3FszMgQx6szz2BWshI/Kcdk2hDY0e";

export class LoginUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly logService: LogService,
    private readonly users: UserRepository,
  ) {}

  async execute(email: string, password: string) {
    const user = await this.users.findByEmail(email);

    if (!user || !user.passwordHash) {
      await this.passwordHasher.compare(password, DUMMY_HASH);
      throw new AppError("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    await this.logService.recordLoginAttempt(user.id, isPasswordValid);

    if (!isPasswordValid) {
      throw new AppError("INVALID_CREDENTIALS");
    }

    return this.tokenService.issueTokenPair(user);
  }
}
