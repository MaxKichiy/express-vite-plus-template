import { z } from "zod";

import { sharedDto } from "./shared";
import { toSuccessResponseDto } from "./success-response.dto";

export const LoginResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      accessToken: sharedDto.accessToken,
    }),
  })
  .meta({ id: "LoginResponse" });

export function toLoginResponseDto({ accessToken }: { accessToken: string }) {
  return LoginResponseSchema.parse(toSuccessResponseDto({ accessToken }));
}
