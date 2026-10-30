import { errors } from "@src/constants/error.constant";

export type ErrorCode = keyof typeof errors;

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}
