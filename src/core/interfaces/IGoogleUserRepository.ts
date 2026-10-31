export type GoogleUser = {
  id: string;
  userId: string;
  googleAccountId: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type NewUser = {
  id?: string;
  googleAccountId: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export interface IGoogleUserRepository {
  findOneByEmail(email: string): Promise<GoogleUser | null>;
  findGoogleUserByUserId(userId: string): Promise<GoogleUser | null>;
  create(googleUser: NewUser): Promise<GoogleUser>;
  update(id: string, data: NewUser): Promise<GoogleUser>;
}
