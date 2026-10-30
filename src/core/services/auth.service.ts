import bcryptjs from "bcryptjs";
import {
  BadRequest,
  Conflict,
  InternalServerError,
  NotFound,
  Unauthorized,
} from "http-errors";

import * as Sentry from "@sentry/node";
import { errors } from "../../constants/error.constant";
import { Prisma, UserRole } from "../../generated/prisma/client";
import { GoogleProvider } from "../../providers/google.provider";
import { PasswordResetRepository } from "../../repositories/password-reset.repository";
import { GoogleUserService } from "./google-user.service";
import { LogService } from "./log.service";
import { TokenService } from "./token.service";
import { UserService } from "../users/user.service";
import { EmailService } from "@src/core/services/email/email.service";
import { EmailVerificationService } from "@src/core/services/email-verification.service";
import { prisma } from "@src/infrastructure/database/prisma";
import { AppError } from "../error";

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export class AuthService {
  private readonly googleUserService: GoogleUserService =
    new GoogleUserService();
  private readonly logService: LogService = new LogService();
  private readonly passwordResetRepository: PasswordResetRepository =
    new PasswordResetRepository();
  private readonly googleProvider: GoogleProvider = new GoogleProvider();

  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userService: UserService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);

    if (!user) {
      throw new BadRequest(errors.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcryptjs.compare(
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
      throw new Conflict(errors.USER_ALREADY_EXIST);
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    const userToCreate = {
      firstName,
      lastName,
      email,
      phoneNumber,
      passwordHash,
      role: UserRole.USER,
    };

    return await prisma.$transaction(async (tx) => {
      const createdUser = await this.userService.create(userToCreate, tx);

      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(createdUser),
        this.tokenService.generateRefreshToken(createdUser),
      ]);

      await this.emailVerificationService.sendEmailVerification(
        createdUser.id,
        createdUser.email,
        tx,
      );

      return { accessToken, currentUser: createdUser, refreshToken };
    });
  }

  async googleAuth(credential: string) {
    const googleClient = this.googleProvider.getGoogleClient();

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      !payload.given_name ||
      !payload.family_name
    ) {
      //TODO: check how it will work after testsing. AI tells me that I should create separate class for it in lesson 9 or 10.
      throw new Unauthorized(errors.INVALID_CREDENTIALS);
    }

    let [existingGoogleUser, existingUser] = await Promise.all([
      this.googleUserService.findByEmail(payload.email),
      this.userService.findByEmail(payload.email),
    ]);

    const userData: Prisma.UserCreateInput = {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      emailVerifiedAt: new Date(),
    };

    const googleUserData: Omit<Prisma.GoogleUserCreateInput, "user"> = {
      googleAccountId: payload.sub!,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      emailVerified: true,
    };

    return await prisma.$transaction(async (tx) => {
      if (existingUser && !existingGoogleUser) {
        existingGoogleUser = await this.googleUserService.create(
          existingUser.id,
          googleUserData,
          tx,
        );
      } else if (!existingUser && existingGoogleUser) {
        existingGoogleUser = await this.googleUserService.update(
          existingGoogleUser.id,
          googleUserData,
          tx,
        );

        existingUser = await this.userService.create(userData, tx);
      } else {
        existingUser = await this.userService.create(userData, tx);

        existingGoogleUser = await this.googleUserService.create(
          existingUser.id,
          googleUserData,
          tx,
        );
      }

      if (!existingUser.emailVerifiedAt) {
        existingUser = await this.userService.update(
          existingUser.id,
          { emailVerifiedAt: new Date() },
          tx,
        );
      }

      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateAccessToken(existingUser),
        this.tokenService.generateRefreshToken(existingUser),
      ]);

      return { accessToken, currentUser: existingUser, refreshToken };
    });
  }

  async verifyEmail(userId: string, token: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new InternalServerError(errors.USER_NOT_FOUND);
    }

    return await prisma.$transaction(async (tx) => {
      await this.emailVerificationService.validateEmailVerification(
        userId,
        token,
        tx,
      );

      const currentUser = await this.userService.update(
        userId,
        { emailVerifiedAt: new Date() },
        tx,
      );

      return { currentUser };
    });
  }

  async resendVerification(userId: string, email: string) {
    const currentUser = await this.userService.findByIdOrThrow(userId);
    await this.emailVerificationService.resendEmailVerification(userId, email);
    return currentUser;
  }

  async refreshToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new AppError(errors.UNAUTHORIZED);
    }

    const user = await this.tokenService.verifyRefreshToken(refreshToken);
    return await this.tokenService.generateAccessToken(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      const passwordReset = await this.passwordResetRepository.create(
        user.id,
        tx,
      );
      await this.logService.recordForgotPassword(user.id, tx);

      try {
        await this.emailService.sendResetPasswordEmail(
          user.email,
          passwordReset.token,
        );
      } catch (err) {
        Sentry.captureException(err);
        throw new InternalServerError(errors.EMAIL_NOT_SENT);
      }
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const passwordResetRecord = await this.passwordResetRepository.find(token);

    if (!passwordResetRecord) {
      throw new NotFound(errors.PASSWORD_RESET_TOKEN_NOT_FOUND);
    }

    const user = await this.userService.findByIdOrThrow(
      passwordResetRecord.userId,
    );
    const passwordHash = await bcryptjs.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await this.userService.update(user.id, { passwordHash }, tx);
      await this.passwordResetRepository.expire(passwordResetRecord.id, tx);
      await this.logService.recordPasswordReset(user.id, tx);
    });
  }
}
