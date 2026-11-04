import { expect } from "vite-plus/test";
import { AppError, type ErrorCode } from "#src/core/error";

export async function expectAppError(
  promise: Promise<unknown | void>,
  code: ErrorCode,
) {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await expect(promise).rejects.toMatchObject({ code });
}
