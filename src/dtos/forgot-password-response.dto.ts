import { z } from "zod";

import { successMessage } from "../constants/success.constant";
import { toSuccessResponseDto } from "./success-response.dto";

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
