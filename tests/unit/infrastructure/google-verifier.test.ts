import { LoginTicket, type TokenPayload } from "google-auth-library";
import { describe, expect, it } from "vite-plus/test";
import {
  GoogleVerifier,
  type IdTokenClient,
} from "#src/infrastructure/providers/GoogleVerifier";

const goodPayload: TokenPayload = {
  iss: "https://accounts.google.com",
  aud: "our-client-id",
  iat: 0,
  exp: 0,
  sub: "google-123",
  email: "ada@gmail.com",
  email_verified: true,
  given_name: "Ada",
  family_name: "Lovelace",
};

function googleThatReturns(payload: TokenPayload) {
  const calls: { idToken: string; audience: string }[] = [];
  const client: IdTokenClient = {
    async verifyIdToken(options) {
      calls.push(options);
      return new LoginTicket("envelope", payload);
    },
  };
  return { verifier: new GoogleVerifier(client, "our-client-id"), calls };
}

describe("GoogleVerifier.verify", () => {
  it("maps Google's payload to an identity", async () => {
    const { verifier } = googleThatReturns(goodPayload);

    await expect(verifier.verify("cred")).resolves.toEqual({
      googleAccountId: "google-123",
      email: "ada@gmail.com",
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });

  it("checks the token was issued for our app", async () => {
    const { verifier, calls } = googleThatReturns(goodPayload);

    await verifier.verify("cred");

    expect(calls).toEqual([{ idToken: "cred", audience: "our-client-id" }]);
  });

  it("returns null when Google hasn't verified the email", async () => {
    const { verifier } = googleThatReturns({
      ...goodPayload,
      email_verified: false,
    });
    await expect(verifier.verify("cred")).resolves.toBeNull();
  });

  it.each(["sub", "email", "given_name", "family_name"] as const)(
    "returns null when %s is missing",
    async (field) => {
      const { verifier } = googleThatReturns({
        ...goodPayload,
        [field]: undefined,
      });
      await expect(verifier.verify("cred")).resolves.toBeNull();
    },
  );

  it("returns null when Google rejects the token", async () => {
    const client: IdTokenClient = {
      async verifyIdToken() {
        throw new Error("Token used too late");
      },
    };
    await expect(
      new GoogleVerifier(client, "our-client-id").verify("cred"),
    ).resolves.toBeNull();
  });
});
