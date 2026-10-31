import { errors } from "@src/constants/error.constant";
import { ITokenSigner } from "@src/core/interfaces/ITokenSigner";
import jwt from "jsonwebtoken";

export class JwtTokenSigner implements ITokenSigner {
  constructor(private readonly secret: string) {}

  sign(claims: Record<string, unknown>, expiresInSeconds: number) {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        claims,
        this.secret,
        { expiresIn: expiresInSeconds },
        (err, token) => {
          if (err) {
            return reject(new Error(err.message));
          }

          if (!token) {
            return reject(new Error(errors.UNABLE_TO_GENERATE_TOKEN));
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
