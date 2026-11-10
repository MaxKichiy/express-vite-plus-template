import { AppError } from "../error";
import { GoogleVerifier } from "../interfaces/google-verifier";
import { UnitOfWork } from "../interfaces/unit-of-work";
import { TokenService } from "../services/token.service";

export class SignInWithGoogleUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly google: GoogleVerifier,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(credential: string) {
    const identity = await this.google.verify(credential);
    if (!identity) throw new AppError("INVALID_CREDENTIALS");

    const user = await this.uow.runInTransaction(
      async ({ users, googleUsers }) => {
        const link = await googleUsers.findByGoogleAccountId(
          identity.googleAccountId,
        );

        if (link) {
          const existingUser = await users.findById(link.userId);
          if (!existingUser) throw new AppError("USER_NOT_FOUND");
          return existingUser;
        }

        let user = await users.findByEmail(identity.email);
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

    const { accessToken, refreshToken } =
      await this.tokenService.issueTokenPair(user);
    return { accessToken, currentUser: user, refreshToken };
  }
}
