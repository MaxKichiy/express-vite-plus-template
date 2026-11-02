import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#src/generated/prisma/client";
import { afterAll, beforeEach } from "vite-plus/test";

const url =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:test@localhost:5433/app_test";

if (!new URL(url).pathname.endsWith("_test")) {
  throw new Error(`Refusing to wipe a non-test database: ${url}`);
}

export const testDb = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

export function useCleanDb() {
  beforeEach(async () => {
    await testDb.$executeRawUnsafe(
      `TRUNCATE users, email_verifications, password_resets, phone_verifications, logs, google_users, files CASCADE`,
    );
  });
  afterAll(() => testDb.$disconnect());
}
