import { z } from "zod";

import { toSuccessResponseDto } from "./success-response.dto";
import { successMessage } from "@src/config/constants/success.constant";

export const ResetPasswordResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.literal(successMessage.PASSWORD_RESET_SUCCESSFULLY),
    }),
  })
  .meta({ id: "ResetPasswordResponse" });

export function toResetPasswordResponseDto() {
  return ResetPasswordResponseSchema.parse(
    toSuccessResponseDto({
      message: successMessage.PASSWORD_RESET_SUCCESSFULLY,
    }),
  );
}
