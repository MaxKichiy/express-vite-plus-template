export interface ITokenSigner {
  sign(
    claims: Record<string, unknown>,
    expiresInSeconds: number,
  ): Promise<string>;
  /** Returns exactly the claims passed to sign(), or null if the token is
   *  invalid, expired or tampered with. Never throws for a bad token. */
  verify(token: string): Promise<Record<string, unknown> | null>;
}
