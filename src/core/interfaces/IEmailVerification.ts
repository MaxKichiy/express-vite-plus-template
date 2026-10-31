import { User } from "../users/user";

export type EmailVerification = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface IEmailVerification {
  sendEmailVerification(
    userId: string,
    newEmail: string,
  ): Promise<EmailVerification>;

  validateEmailVerification(
    userId: string,
    verificationToken: string,
  ): Promise<void>;
  resendEmailVerification(
    userId: string,
    email: string,
  ): Promise<EmailVerification>;

  verifyCode(userId: string, verificationCode: string): Promise<User>;
}

export interface IEmailVerificationRepository {
  create(userId: string, token: string): Promise<EmailVerification>;
  deleteById(id: string): Promise<EmailVerification>;
  expireForUser(userId: string): Promise<{ count: number }>; //this is workaround for Prisma<BatchPayload>
  findValidForUser(
    userId: string,
    token: string,
  ): Promise<EmailVerification | null>;
}
