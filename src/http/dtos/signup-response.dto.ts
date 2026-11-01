import { z } from "zod";

import { CurrentUserSchema, toCurrentUserDto } from "./current-user.dto";
import { sharedDto } from "./shared";
import { toSuccessResponseDto } from "./success-response.dto";
import { User } from "@src/core/users/user";

export const SignUpResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      accessToken: sharedDto.accessToken,
      currentUser: CurrentUserSchema,
    }),
  })
  .meta({ id: "SignUpResponse" });

export function toSignUpResponseDto({
  accessToken,
  currentUser,
}: {
  accessToken: string;
  currentUser: User;
}) {
  return SignUpResponseSchema.parse(
    toSuccessResponseDto({
      accessToken,
      currentUser: toCurrentUserDto(currentUser),
    }),
  );
}
