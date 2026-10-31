import { Unauthorized } from "http-errors";

import { errors } from "../../constants/error.constant";
import { UserRole } from "../../generated/prisma/client";
import { ITokenSigner } from "../interfaces/ITokenSigner";
import z from "zod";
import { User } from "../users/user";
import { UserService } from "../users/user.service";

const AccessClaims = z.object({
  type: z.literal("access"),
  id: z.string(),
  emailVerified: z.boolean(),
  role: z.enum(UserRole),
});
const RefreshClaims = z.object({ type: z.literal("refresh"), id: z.string() });

export class TokenService {
  constructor(
    private readonly signer: ITokenSigner,
    private readonly userService: UserService,
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
      throw new Unauthorized(errors.INVALID_TOKEN);
    }

    try {
      return await this.userService.findByIdOrThrow(claims.data.id);
    } catch {
      throw new Unauthorized(errors.UNAUTHORIZED);
    }
  }
}
