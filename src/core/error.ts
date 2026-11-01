import { errors } from "@src/config/constants/error.constant";

export type ErrorCode = keyof typeof errors;

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options);
  }
}
