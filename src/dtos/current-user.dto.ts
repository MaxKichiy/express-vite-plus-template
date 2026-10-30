import { z } from "zod";

import { User } from "../generated/prisma/client";
import { sharedDto } from "./shared";

export const CurrentUserSchema = z
  .object({
    id: sharedDto.id,
    email: sharedDto.email,
    firstName: sharedDto.firstName,
    lastName: sharedDto.lastName,
    role: sharedDto.role,
    emailVerified: sharedDto.emailVerified,
    phoneNumber: sharedDto.phoneNumber,
    phoneVerified: sharedDto.phoneVerified,
    createdAt: sharedDto.createdAt,
    updatedAt: sharedDto.updatedAt,
  })
  .meta({ id: "CurrentUser" });

export function toCurrentUserDto(user: User) {
  return CurrentUserSchema.parse({
    ...user,
    emailVerified: user.emailVerifiedAt !== null,
    phoneVerified: user.phoneVerifiedAt !== null,
  });
}
