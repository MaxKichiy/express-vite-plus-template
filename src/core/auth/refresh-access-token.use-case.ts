import { AppError } from "../error";
import { TokenService } from "../services/token.service";

export class RefreshAccessTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new AppError("UNAUTHORIZED");
    }

    const user = await this.tokenService.verifyRefreshToken(refreshToken);
    return await this.tokenService.generateAccessToken(user);
  }
}
