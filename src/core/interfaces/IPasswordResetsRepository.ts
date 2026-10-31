export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetsRepository {
  create(userId: string): Promise<PasswordReset>;
  expire(id: string): Promise<PasswordReset>;
  find(token: string): Promise<PasswordReset | null>;
}
