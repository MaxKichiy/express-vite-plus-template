import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@src/config/env";

import { PrismaClient } from "@src/generated/prisma/client";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});
