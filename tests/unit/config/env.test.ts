import { parseEnv } from "#src/config/env";
import { expect, it } from "vite-plus/test";

const minimalEnv = {
  APP_URL: "http://a.co",
  BASE_URL: "http://b.co",
  DATABASE_URL: "postgresql://x",
  AWS_SES_SENDER: "sender@example.com",
  AWS_SES_REGION: "us-east-1",
  GOOGLE_OAUTH_CLIENT_ID: "google-client-id",
  GOOGLE_OAUTH_CLIENT_SECRET: "google-client-secret",
  JWT_SECRET_KEY: "jwt-secret",
  ACCESS_TOKEN_EXPIRE: "3600000",
  REFRESH_TOKEN_EXPIRE: "604800000",
  EMAIL_VERIFICATION_EXPIRE: "1800000",
  PASSWORD_RESET_EXPIRE: "900000",
  PORT: "5000",
  NODE_ENV: "production",
  SENTRY_ENV: "production",
  CORS_ORIGIN: "http://example.com",
  SENTRY_DSN: "https://sentry-dsn@example.com/123",
};

it("splits a comma-separated CORS_ORIGIN into a list", () => {
  const env = parseEnv({
    ...minimalEnv,
    CORS_ORIGIN: "https://a.co, https://b.co",
  });
  expect(env.CORS_ORIGIN).toEqual(["https://a.co", "https://b.co"]);
});
