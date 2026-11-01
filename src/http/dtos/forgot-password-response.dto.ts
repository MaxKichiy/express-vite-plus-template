import { z } from "zod";

import { toSuccessResponseDto } from "./success-response.dto";
import { successMessage } from "@src/config/constants/success.constant";

export const ForgotPasswordResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      message: z.literal(successMessage.EMAIL_SENT_SUCCESSFULLY),
    }),
  })
  .meta({ id: "ForgotPasswordResponse" });

export function toForgotPasswordResponseDto() {
  return ForgotPasswordResponseSchema.parse(
    toSuccessResponseDto({
      message: successMessage.EMAIL_SENT_SUCCESSFULLY,
    }),
  );
}
