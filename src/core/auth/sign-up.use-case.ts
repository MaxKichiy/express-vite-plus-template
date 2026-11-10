import { randomUUID } from "crypto";
import { AppError } from "../error";
import { TokenService } from "../services/token.service";
import { EmailService } from "../services/email/email.service";
import { UserRepository } from "../users/user.repository";
import { UnitOfWork } from "../interfaces/unit-of-work";
import { PasswordHasher } from "../interfaces/password-hasher";

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export class SignUpUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly uow: UnitOfWork,
    private readonly emailService: EmailService,
    private readonly users: UserRepository,
  ) {}
  async execute(data: SignUpInput) {
    const { firstName, lastName, email, password, phoneNumber } = data;
    const user = await this.users.findByEmail(email);

    if (user) {
      throw new AppError("USER_ALREADY_EXIST");
    }

    const passwordHash = await this.passwordHasher.hash(password);

    const { createdUser, token } = await this.uow.runInTransaction(
      async ({ users, emailVerifications }) => {
        const createdUser = await users.create({
          firstName,
          lastName,
          email,
          phoneNumber,
          passwordHash,
          role: "USER",
        });

        const token = randomUUID();
        await emailVerifications.create(createdUser.id, token);
        return { createdUser, token };
      },
    );

    try {
      await this.emailService.sendVerificationEmail(createdUser.email, token);
    } catch (err) {
      throw new AppError("EMAIL_NOT_SENT", { cause: err });
    }

    const { accessToken, refreshToken } =
      await this.tokenService.issueTokenPair(createdUser);

    return { accessToken, currentUser: createdUser, refreshToken };
  }
}
