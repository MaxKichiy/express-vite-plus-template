import { z } from "zod";

import { sharedValidator } from "./shared";

export const GoogleOAuthCallbackSchema = z
  .object({
    body: z.object({
      credential: sharedValidator.googleCredential,
    }),
  })
  .meta({ id: "GoogleOAuthCallbackRequest" });

export type GoogleOAuthCallbackRequest = z.infer<typeof GoogleOAuthCallbackSchema>;
