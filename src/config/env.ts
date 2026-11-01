import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  ACCESS_TOKEN_EXPIRE: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60 * 24),
  APP_URL: z.url(),
  AWS_SES_SENDER: z.email(),
  AWS_SES_REGION: z.string(),
  BASE_URL: z.url(),
  CORS_ORIGIN: z
    .string()
    .optional()
    .default("*")
    .transform((it) => it.split(","))
    .transform((it) => it.map((it) => it.trim()))
    .transform((it) => (it.length === 1 && it[0] !== undefined ? it[0] : it)),
  DATABASE_URL: z.url(),
  EMAIL_VERIFICATION_EXPIRE: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60 * 24),
  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  JWT_SECRET_KEY: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
  PASSWORD_RESET_EXPIRE: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60),
  PORT: z.coerce.number().optional().default(4000),
  REFRESH_TOKEN_EXPIRE: z.coerce
    .number()
    .optional()
    .default(1000 * 60 * 60 * 24 * 90),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENV: z.enum(["development", "production", "staging"]).optional().default("development"),
});

export const env = envSchema.parse(process.env);
