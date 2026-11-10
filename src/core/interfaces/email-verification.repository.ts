export type EmailVerification = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface EmailVerificationRepository {
  create(userId: string, token: string): Promise<EmailVerification>;
  expireForUser(userId: string): Promise<{ count: number }>; //this is workaround for Prisma<BatchPayload>
  findValidForUser(
    userId: string,
    token: string,
  ): Promise<EmailVerification | null>;
}
