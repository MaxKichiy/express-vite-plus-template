import { OAuth2Client } from "google-auth-library";

import { env } from "../env";

export class GoogleProvider {
  getGoogleClient(): OAuth2Client {
    return new OAuth2Client(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
  }
}
