import { describe, it, expect, beforeEach, afterAll, vi } from "vite-plus/test";
describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should parse environment variables with default values", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";

    const { env } = require("../src/env");

    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.AWS_SES_SENDER).toBe("sender@example.com");
    expect(env.AWS_SES_REGION).toBe("us-east-1");
    expect(env.BASE_URL).toBe("http://localhost:4000");
    expect(env.DATABASE_URL).toBe("postgresql://localhost:5432/test");
    expect(env.GOOGLE_OAUTH_CLIENT_ID).toBe("google-client-id");
    expect(env.GOOGLE_OAUTH_CLIENT_SECRET).toBe("google-client-secret");
    expect(env.JWT_SECRET_KEY).toBe("jwt-secret");

    expect(env.ACCESS_TOKEN_EXPIRE).toBe(1000 * 60 * 60 * 24);
    expect(env.REFRESH_TOKEN_EXPIRE).toBe(1000 * 60 * 60 * 24 * 90);
    expect(env.EMAIL_VERIFICATION_EXPIRE).toBe(1000 * 60 * 60 * 24);
    expect(env.PASSWORD_RESET_EXPIRE).toBe(1000 * 60 * 60);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe("test");
    expect(env.SENTRY_ENV).toBe("development");
  });

  it("should override default values with environment variables", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";

    process.env.ACCESS_TOKEN_EXPIRE = "3600000";
    process.env.REFRESH_TOKEN_EXPIRE = "604800000";
    process.env.EMAIL_VERIFICATION_EXPIRE = "1800000";
    process.env.PASSWORD_RESET_EXPIRE = "900000";
    process.env.PORT = "5000";
    process.env.NODE_ENV = "production";
    process.env.SENTRY_ENV = "production";
    process.env.CORS_ORIGIN = "http://example.com";
    process.env.SENTRY_DSN = "https://sentry-dsn@example.com/123";

    const { env } = require("../src/env");

    expect(env.ACCESS_TOKEN_EXPIRE).toBe(3600000);
    expect(env.REFRESH_TOKEN_EXPIRE).toBe(604800000);
    expect(env.EMAIL_VERIFICATION_EXPIRE).toBe(1800000);
    expect(env.PASSWORD_RESET_EXPIRE).toBe(900000);
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe("production");
    expect(env.SENTRY_ENV).toBe("production");
    expect(env.CORS_ORIGIN).toBe("http://example.com");
    expect(env.SENTRY_DSN).toBe("https://sentry-dsn@example.com/123");
  });

  it("should parse CORS_ORIGIN as array when comma-separated", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";
    process.env.CORS_ORIGIN = "http://localhost:3000,http://localhost:3001,http://example.com";

    const { env } = require("../src/env");

    expect(env.CORS_ORIGIN).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
      "http://example.com",
    ]);
  });

  it("should handle single CORS_ORIGIN as string", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";
    process.env.CORS_ORIGIN = "http://localhost:3000";

    const { env } = require("../src/env");

    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
  });

  it("should validate email format for AWS_SES_SENDER", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "invalid-email";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";

    expect(() => {
      require("../src/env");
    }).toThrow();
  });

  it("should validate URL format for APP_URL and BASE_URL", () => {
    process.env.APP_URL = "invalid-url";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";

    expect(() => {
      require("../src/env");
    }).toThrow();
  });

  it("should validate NODE_ENV enum values", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";
    process.env.NODE_ENV = "invalid-env";

    expect(() => {
      require("../src/env");
    }).toThrow();
  });

  it("should validate SENTRY_ENV enum values", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";
    process.env.SENTRY_ENV = "invalid-sentry-env";

    expect(() => {
      require("../src/env");
    }).toThrow();
  });

  it("should handle numeric string coercion", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";
    process.env.PORT = "8080";
    process.env.ACCESS_TOKEN_EXPIRE = "7200000";

    const { env } = require("../src/env");

    expect(env.PORT).toBe(8080);
    expect(env.ACCESS_TOKEN_EXPIRE).toBe(7200000);
    expect(typeof env.PORT).toBe("number");
    expect(typeof env.ACCESS_TOKEN_EXPIRE).toBe("number");
  });

  it("should handle optional SENTRY_DSN", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.AWS_SES_SENDER = "sender@example.com";
    process.env.AWS_SES_REGION = "us-east-1";
    process.env.BASE_URL = "http://localhost:4000";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.GOOGLE_OAUTH_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "google-client-secret";
    process.env.JWT_SECRET_KEY = "jwt-secret";

    process.env.SENTRY_DSN = undefined;

    const { env } = require("../src/env");

    expect(env.SENTRY_DSN).toBeFalsy();
  });
});
