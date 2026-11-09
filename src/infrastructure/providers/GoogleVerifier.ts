import { IGoogleVerifier } from "#src/core/interfaces/IGoogleVerifier";
import { LoginTicket } from "google-auth-library";

export type IdTokenClient = {
  verifyIdToken(options: {
    idToken: string;
    audience: string;
  }): Promise<LoginTicket>;
};

export class GoogleVerifier implements IGoogleVerifier {
  constructor(
    private readonly client: IdTokenClient,
    private readonly clientId: string,
  ) {}

  async verify(credential: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      const p = ticket.getPayload();
      if (
        !p?.sub ||
        !p.email ||
        !p.email_verified ||
        !p.given_name ||
        !p.family_name
      )
        return null;
      return {
        googleAccountId: p.sub,
        email: p.email,
        firstName: p.given_name,
        lastName: p.family_name,
      };
    } catch {
      return null;
    }
  }
}
