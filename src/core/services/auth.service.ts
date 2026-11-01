import { TokenService } from "./token.service";
import { UserService } from "../users/user.service";
import { EmailService } from "@src/core/services/email/email.service";
import { EmailVerificationService } from "@src/core/services/email-verification.service";
import { AppError } from "../error";
import { IPasswordResetsRepository } from "../interfaces/IPasswordResetsRepository";
import { LogService } from "./log.service";
import { IUnitOfWork } from "../interfaces/IUnitOfWork";
import { IPasswordEncryption } from "../interfaces/IPasswordEncryption";
import { IGoogleVerifier } from "../interfaces/IGoogleVerifier";
import { randomUUID } from "crypto";

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userService: UserService,
    private readonly uow: IUnitOfWork,
    private readonly logService: LogService,
    private readonly passwordResetRepository: IPasswordResetsRepository,
    private readonly passwordEncryptionService: IPasswordEncryption,
    private readonly google: IGoogleVerifier,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new AppError("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await this.passwordEncryptionService.compare(
      password,
      user.passwordHash!,
    );
    await this.logService.recordLoginAttempt(user.id, isPasswordValid);

    if (!isPasswordValid) {
      throw new AppError("INVALID_CREDENTIALS");
    }

    return await Promise.all([
      this.tokenService.generateAccessToken(user),
      this.tokenService.generateRefreshToken(user),
    ]);
  }

  async signUp(data: SignUpInput) {
    const { firstName, lastName, email, password, phoneNumber } = data;
    const user = await this.userService.findByEmail(email);

    if (user) {
      throw new AppError("USER_ALREADY_EXIST");
    }

    const passwordHash = await this.passwordEncryptionService.hash(password);

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
    await this.emailService.sendVerificationEmail(createdUser.email, token);

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(createdUser),
      this.tokenService.generateRefreshToken(createdUser),
    ]);
    return { accessToken, currentUser: createdUser, refreshToken };
  }

  async googleAuth(credential: string) {
    const identity = await this.google.verify(credential);
    if (!identity) throw new AppError("INVALID_CREDENTIALS");

    const user = await this.uow.runInTransaction(
      async ({ users, googleUsers }) => {
        const link = await googleUsers.findGoogleUserByUserId(
          identity.googleAccountId,
        );

        if (link) {
          const existingUser = await users.findById(link.userId);
          if (!existingUser) throw new AppError("USER_NOT_FOUND");
          return existingUser;
        }

        let user = await users.findByEmail(identity?.email);
        if (!user) {
          user = await users.create({
            email: identity.email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            emailVerifiedAt: new Date(),
          });
        } else if (!user.emailVerifiedAt) {
          user = await users.update(user.id, {
            emailVerifiedAt: new Date(),
            passwordHash: null,
          });
        }

        await googleUsers.create({
          userId: user.id,
          googleAccountId: identity.googleAccountId,
          email: identity.email,
          firstName: identity.firstName,
          lastName: identity.lastName,
        });

        return user;
      },
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user),
      this.tokenService.generateRefreshToken(user),
    ]);
    return { accessToken, currentUser: user, refreshToken };
  }

  async verifyEmail(userId: string, token: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new AppError("USER_NOT_FOUND");
    }

    return await this.uow.runInTransaction(
      async ({ users, emailVerifications }) => {
        await new EmailVerificationService(
          this.emailService,
          this.userService,
          emailVerifications,
        ).validateEmailVerification(userId, token);

        const currentUser = await new UserService(users).update(userId, {
          emailVerifiedAt: new Date(),
        });
        return { currentUser };
      },
    );
  }

  async resendVerification(userId: string, email: string) {
    const currentUser = await this.userService.findByIdOrThrow(userId);
    await this.emailVerificationService.resendEmailVerification(userId, email);
    return currentUser;
  }

  async refreshToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new AppError("UNAUTHORIZED");
    }

    const user = await this.tokenService.verifyRefreshToken(refreshToken);
    return await this.tokenService.generateAccessToken(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return;
    }
    const token = await this.uow.runInTransaction(
      async ({ passwordResets, logs }) => {
        const r = await passwordResets.create(user.id);
        await new LogService(logs).recordForgotPassword(user.id);

        return r;
      },
    );

    try {
      await this.emailService.sendResetPasswordEmail(user.email, token);
    } catch (err) {
      throw new AppError("EMAIL_NOT_SENT", { cause: err });
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.passwordResetRepository.find(token);

    if (!record) {
      throw new AppError("PASSWORD_RESET_TOKEN_NOT_FOUND");
    }

    const passwordHash = await this.passwordEncryptionService.hash(newPassword);

    await this.uow.runInTransaction(async ({ users, passwordResets, logs }) => {
      const user = await users.findById(record.userId);
      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }
      await users.update(user.id, { passwordHash });
      await passwordResets.expire(record.id);
      await new LogService(logs).recordPasswordReset(user.id);
    });
  }
}
