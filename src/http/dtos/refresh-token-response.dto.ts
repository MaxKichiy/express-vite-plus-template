import { z } from "zod";

import { sharedDto } from "./shared";
import { toSuccessResponseDto } from "./success-response.dto";

export const RefreshTokenResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      accessToken: sharedDto.accessToken,
    }),
  })
  .meta({ id: "RefreshTokenResponse" });

export function toRefreshTokenResponseDto({ accessToken }: { accessToken: string }) {
  return RefreshTokenResponseSchema.parse(toSuccessResponseDto({ accessToken }));
}
