import { TokenSigner } from "../interfaces/token-signer";
import z from "zod";
import { User, UserRole } from "../users/user";
import { AppError } from "../error";
import { UserRepository } from "../users/user.repository";

const AccessClaims = z.object({
  type: z.literal("access"),
  id: z.string(),
  emailVerified: z.boolean(),
  role: z.enum(["ADMIN", "USER"] as const satisfies readonly UserRole[]),
});
const RefreshClaims = z.object({ type: z.literal("refresh"), id: z.string() });

export class TokenService {
  constructor(
    private readonly signer: TokenSigner,
    private readonly users: UserRepository,
    private readonly ttl: { access: number; refresh: number },
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    return this.signer.sign(
      {
        type: "access",
        id: user.id,
        emailVerified: user.emailVerifiedAt !== null,
        role: user.role,
      },
      this.ttl.access,
    );
  }

  async generateRefreshToken(user: User): Promise<string> {
    return this.signer.sign({ type: "refresh", id: user.id }, this.ttl.refresh);
  }

  verifyAccessToken(token: string) {
    return this.userFrom(token, AccessClaims);
  }
  verifyRefreshToken(token: string) {
    return this.userFrom(token, RefreshClaims);
  }

  private async userFrom(
    token: string,
    schema: z.ZodType<{ id: string }>,
  ): Promise<User> {
    const claims = schema.safeParse(await this.signer.verify(token));
    if (!claims.success) {
      throw new AppError("INVALID_TOKEN");
    }

    const user = await this.users.findById(claims.data.id);
    if (!user) throw new AppError("UNAUTHORIZED");

    return user;
  }

  async issueTokenPair(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return { accessToken, refreshToken };
  }
}
