import { z } from "zod";

import { toSuccessResponseDto } from "./success-response.dto";

export const HealthResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      database: z.boolean().meta({
        description: "Indicates if database is connected",
        example: true,
      }),
    }),
  })
  .meta({ id: "HealthResponse" });

export function toHealthResponseDto({ database }: { database: boolean }) {
  return HealthResponseSchema.parse(toSuccessResponseDto({ database }));
}
