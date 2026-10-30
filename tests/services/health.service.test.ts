import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from "vite-plus/test";
import * as Sentry from "@sentry/node";

import { HealthService } from "../../src/core/services/health.service";

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

vi.mock("../../prisma/client", () => ({
  prisma: {
    $executeRaw: vi.fn(),
  },
}));

import { prisma } from "../../prisma/client";

const mockPrismaExecuteRaw = prisma.$executeRaw as MockedFunction<
  typeof prisma.$executeRaw
>;
const mockSentryCaptureException = Sentry.captureException as MockedFunction<
  typeof Sentry.captureException
>;

describe("HealthService", () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
    vi.clearAllMocks();
  });

  describe("checkDatabase", () => {
    it("should return true when database connection is successful", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      const result = await healthService.checkDatabase();

      expect(result).toBe(true);
      expect(mockPrismaExecuteRaw).toHaveBeenCalledWith(expect.any(Object));
      expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });

    it("should return false when database connection fails", async () => {
      const dbError = new Error("Connection refused");
      mockPrismaExecuteRaw.mockRejectedValue(dbError);

      const result = await healthService.checkDatabase();

      expect(result).toBe(false);
      expect(mockPrismaExecuteRaw).toHaveBeenCalledWith(expect.any(Object));
      expect(mockSentryCaptureException).toHaveBeenCalledWith(dbError);
    });

    it("should handle different database errors", async () => {
      const errors = [
        new Error("Database not found"),
        new Error("Authentication failed"),
        new Error("Network timeout"),
        new TypeError("Invalid connection string"),
      ];

      for (const error of errors) {
        mockPrismaExecuteRaw.mockRejectedValueOnce(error);

        const result = await healthService.checkDatabase();

        expect(result).toBe(false);
        expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
      }

      expect(mockPrismaExecuteRaw).toHaveBeenCalledTimes(errors.length);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(errors.length);
    });

    it("should execute correct raw SQL query", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      await healthService.checkDatabase();

      expect(mockPrismaExecuteRaw).toHaveBeenCalledWith(["SELECT 1"]);
    });

    it("should handle prisma client throwing synchronous errors", async () => {
      const syncError = new Error("Synchronous prisma error");
      mockPrismaExecuteRaw.mockImplementation(() => {
        throw syncError;
      });

      const result = await healthService.checkDatabase();

      expect(result).toBe(false);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(syncError);
    });

    it("should handle null response from database", async () => {
      mockPrismaExecuteRaw.mockResolvedValue(null as any);

      const result = await healthService.checkDatabase();

      expect(result).toBe(true);
      expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });

    it("should handle empty array response from database", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([] as any);

      const result = await healthService.checkDatabase();

      expect(result).toBe(true);
      expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });

    it("should handle undefined response from database", async () => {
      mockPrismaExecuteRaw.mockResolvedValue(undefined as any);

      const result = await healthService.checkDatabase();

      expect(result).toBe(true);
      expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });
  });

  describe("check", () => {
    it("should return health check result with database status", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      const result = await healthService.check();

      expect(result).toEqual({
        database: true,
      });
      expect(mockPrismaExecuteRaw).toHaveBeenCalledTimes(1);
    });

    it("should return health check result with database failure", async () => {
      const dbError = new Error("Database connection failed");
      mockPrismaExecuteRaw.mockRejectedValue(dbError);

      const result = await healthService.check();

      expect(result).toEqual({
        database: false,
      });
      expect(mockSentryCaptureException).toHaveBeenCalledWith(dbError);
    });

    it("should use Promise.all for concurrent health checks", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      const checkSpy = vi.spyOn(healthService, "checkDatabase");

      await healthService.check();

      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(mockPrismaExecuteRaw).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple concurrent database checks", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      const promises = [
        healthService.check(),
        healthService.check(),
        healthService.check(),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({
          database: true,
        });
      });

      expect(mockPrismaExecuteRaw).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed database connection scenarios", async () => {
      mockPrismaExecuteRaw
        .mockResolvedValueOnce([{ "?column?": 1 }] as any)
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockResolvedValueOnce([{ "?column?": 1 }] as any);

      const results = await Promise.all([
        healthService.check(),
        healthService.check(),
        healthService.check(),
      ]);

      expect(results).toEqual([
        { database: true },
        { database: false },
        { database: true },
      ]);

      expect(mockPrismaExecuteRaw).toHaveBeenCalledTimes(3);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should maintain consistent return structure", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);
      const successResult = await healthService.check();

      expect(successResult).toHaveProperty("database");
      expect(typeof successResult.database).toBe("boolean");

      mockPrismaExecuteRaw.mockRejectedValue(new Error("DB Error"));
      const failResult = await healthService.check();

      expect(failResult).toHaveProperty("database");
      expect(typeof failResult.database).toBe("boolean");
      expect(Object.keys(successResult)).toEqual(Object.keys(failResult));
    });

    it("should handle extremely slow database responses", async () => {
      const executeRawImpl = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(1 as any);
          }, 200);
        });
      };

      mockPrismaExecuteRaw.mockImplementation(executeRawImpl as any);

      const startTime = Date.now();
      const result = await healthService.check();
      const endTime = Date.now();

      expect(result).toEqual({
        database: true,
      });
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it("should handle database timeout errors", async () => {
      const timeoutError = new Error("Query timeout");
      timeoutError.name = "QueryTimeout";
      mockPrismaExecuteRaw.mockRejectedValue(timeoutError);

      const result = await healthService.check();

      expect(result).toEqual({
        database: false,
      });
      expect(mockSentryCaptureException).toHaveBeenCalledWith(timeoutError);
    });
  });

  describe("error logging", () => {
    it("should log database connection errors to Sentry", async () => {
      const connectionError = new Error("Connection pool exhausted");
      mockPrismaExecuteRaw.mockRejectedValue(connectionError);

      await healthService.checkDatabase();

      expect(mockSentryCaptureException).toHaveBeenCalledWith(connectionError);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should log multiple different errors", async () => {
      const errors = [
        new Error("First error"),
        new Error("Second error"),
        new Error("Third error"),
      ];

      for (const error of errors) {
        mockPrismaExecuteRaw.mockRejectedValueOnce(error);
        await healthService.checkDatabase();
      }

      expect(mockSentryCaptureException).toHaveBeenCalledTimes(3);
      errors.forEach((error) => {
        expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
      });
    });

    it("should not log errors when database is healthy", async () => {
      mockPrismaExecuteRaw.mockResolvedValue([{ "?column?": 1 }] as any);

      await healthService.checkDatabase();
      await healthService.check();

      expect(mockSentryCaptureException).not.toHaveBeenCalled();
    });

    it("should capture error details in Sentry", async () => {
      const detailedError = new Error("Detailed database error");
      detailedError.stack = "Error stack trace";
      (detailedError as any).code = "CONNECTION_REFUSED";

      mockPrismaExecuteRaw.mockRejectedValue(detailedError);

      await healthService.checkDatabase();

      expect(mockSentryCaptureException).toHaveBeenCalledWith(detailedError);

      const capturedError = mockSentryCaptureException.mock
        .calls[0]?.[0] as Error & {
        code?: string;
      };
      expect(capturedError.message).toBe("Detailed database error");
      expect(capturedError.code).toBe("CONNECTION_REFUSED");
    });
  });

  describe("service reliability", () => {
    it("should be resilient to repeated failures", async () => {
      const persistentError = new Error("Persistent database issue");

      for (let i = 0; i < 5; i++) {
        mockPrismaExecuteRaw.mockRejectedValueOnce(persistentError);
        const result = await healthService.checkDatabase();
        expect(result).toBe(false);
      }

      expect(mockSentryCaptureException).toHaveBeenCalledTimes(5);
    });

    it("should recover after database comes back online", async () => {
      const error = new Error("Temporary outage");

      mockPrismaExecuteRaw.mockRejectedValueOnce(error);
      let result = await healthService.checkDatabase();
      expect(result).toBe(false);

      mockPrismaExecuteRaw.mockResolvedValueOnce([{ "?column?": 1 }] as any);
      result = await healthService.checkDatabase();
      expect(result).toBe(true);

      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should handle service instantiation multiple times", () => {
      const service1 = new HealthService();
      const service2 = new HealthService();
      const service3 = new HealthService();

      expect(service1).toBeInstanceOf(HealthService);
      expect(service2).toBeInstanceOf(HealthService);
      expect(service3).toBeInstanceOf(HealthService);
      expect(service1).not.toBe(service2);
      expect(service2).not.toBe(service3);
    });
  });
});
