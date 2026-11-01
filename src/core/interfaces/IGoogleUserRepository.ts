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

export type NewGoogleUser = Pick<
  GoogleUser,
  "userId" | "googleAccountId" | "firstName" | "lastName" | "email"
> &
  Partial<Pick<GoogleUser, "emailVerified">>;

export type GoogleUserUpdate = Partial<
  Omit<GoogleUser, "id" | "userId" | "createdAt" | "updatedAt">
>;

export interface IGoogleUserRepository {
  findOneByEmail(email: string): Promise<GoogleUser | null>;
  findGoogleUserByUserId(userId: string): Promise<GoogleUser | null>;
  create(googleUser: NewGoogleUser): Promise<GoogleUser>;
  update(id: string, data: GoogleUserUpdate): Promise<GoogleUser>;
}
