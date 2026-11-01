import { z } from "zod";

export const SuccessResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .meta({ id: "SuccessResponse" });

export function toSuccessResponseDto<T>(data?: T) {
  return {
    success: true as const,
    data,
  };
}
