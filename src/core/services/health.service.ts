import * as Sentry from "@sentry/node";
import { prisma } from "@src/infrastructure/database/prisma";

export class HealthService {
  async checkDatabase() {
    try {
      await prisma.$executeRaw`SELECT 1`;
      return true;
    } catch (err) {
      Sentry.captureException(err);
      return false;
    }
  }

  async check() {
    const [database] = await Promise.all([this.checkDatabase()]);

    return {
      database,
    };
  }
}
