import type {
  GoogleIdentity,
  GoogleVerifier,
} from "#src/core/interfaces/google-verifier";

export class FakeGoogleVerifier implements GoogleVerifier {
  private readonly identities = new Map<string, GoogleIdentity>();

  givenToken(credential: string, identity: Partial<GoogleIdentity> = {}) {
    this.identities.set(credential, {
      googleAccountId: "google-sub-1",
      email: "jane@gmail.com",
      firstName: "Jane",
      lastName: "Doe",
      ...identity,
    });
    return this;
  }

  async verify(credential: string) {
    return this.identities.get(credential) ?? null;
  }
}
