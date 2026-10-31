import { IGoogleVerifier } from "@src/core/interfaces/IGoogleVerifier";
import { env } from "@src/env";
import { OAuth2Client } from "google-auth-library";

export class GoogleProvider {
  getGoogleClient(): OAuth2Client {
    return new OAuth2Client(
      env.GOOGLE_OAUTH_CLIENT_ID,
      env.GOOGLE_OAUTH_CLIENT_SECRET,
    );
  }
}

export class GoogleVerifier implements IGoogleVerifier {
  constructor(
    private readonly client: OAuth2Client,
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
