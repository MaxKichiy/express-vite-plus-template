export const ERROR_CODES = [
  "FORBIDDEN",
  "INTERNAL_SERVER_ERROR",
  "NOT_FOUND",
  "TOO_MANY_REQUESTS",
  "UNAUTHORIZED",
  "EMAIL_NOT_SENT",
  "EMAIL_NOT_VERIFIED",
  "INVALID_CREDENTIALS",
  "INVALID_DATA",
  "INVALID_TOKEN",
  "NO_ACCESS_TOKEN_PROVIDED",
  "PASSWORD_RESET_TOKEN_NOT_FOUND",
  "UNABLE_TO_GENERATE_TOKEN",
  "USER_ALREADY_EXIST",
  "USER_NOT_FOUND",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options);
  }
}
