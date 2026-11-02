import { AppError } from "#src/core/error";
import { ITokenSigner } from "#src/core/interfaces/ITokenSigner";
import jwt from "jsonwebtoken";

export class JwtTokenSigner implements ITokenSigner {
  constructor(private readonly secret: string) {}

  sign(claims: Record<string, unknown>, expiresInMs: number) {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        claims,
        this.secret,
        { expiresIn: Math.floor(expiresInMs / 1000) },
        (err, token) => {
          if (err) {
            return reject(new Error(err.message));
          }

          if (!token) {
            return reject(new AppError("UNABLE_TO_GENERATE_TOKEN"));
          }

          resolve(token);
        },
      );
    });
  }

  verify(token: string) {
    return new Promise<Record<string, unknown> | null>((resolve) =>
      jwt.verify(token, this.secret, async (err, decoded) => {
        return resolve(
          err || !decoded || typeof decoded === "string" ? null : decoded,
        );
      }),
    );
  }
}
