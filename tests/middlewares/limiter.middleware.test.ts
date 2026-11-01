import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from "vite-plus/test";
import * as Sentry from "@sentry/node";
import { Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { TooManyRequests } from "http-errors";

import {
  ipLimiter,
  limiterFactory,
  userLimiter,
} from "../../src/http/middlewares/limiter.middleware";
import { TokenService } from "../../src/core/services/token.service";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";
import { mockAccessToken } from "../mocks/tokens.mock";
import { mockUser } from "../mocks/user.mock";

vi.mock("express-rate-limit");
vi.mock("http-errors");
vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

const mockRateLimit = rateLimit as MockedFunction<typeof rateLimit>;
const mockIpKeyGenerator = ipKeyGenerator as MockedFunction<
  typeof ipKeyGenerator
>;
const mockTooManyRequests = TooManyRequests as MockedFunction<
  typeof TooManyRequests
>;
const mockSentryCaptureException = Sentry.captureException as MockedFunction<
  typeof Sentry.captureException
>;

const mockTokenServiceGetAuthTokenOrThrow = vi.spyOn(
  TokenService.prototype,
  "getAuthTokenOrThrow",
);
const mockTokenServiceValidateToken = vi.spyOn(
  TokenService.prototype,
  "validateToken",
);

describe("Limiter Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("limiterFactory", () => {
    it("should create rate limiter with correct configuration", () => {
      const mockKeyGenerator = vi.fn().mockReturnValue("test-key");
      const windowMs = 60000;
      const limit = 10;

      const mockRateLimitMiddleware = vi.fn() as any;
      mockRateLimitMiddleware.resetKey = vi.fn();
      mockRateLimitMiddleware.getKey = vi.fn();
      mockRateLimit.mockReturnValue(mockRateLimitMiddleware);

      const result = limiterFactory(mockKeyGenerator, windowMs, limit);

      expect(mockRateLimit).toHaveBeenCalledWith({
        windowMs,
        limit,
        keyGenerator: mockKeyGenerator,
        handler: expect.any(Function),
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false,
      });
      expect(result).toBe(mockRateLimitMiddleware);
    });

    it("should handle rate limit exceeded with correct error", () => {
      const mockKeyGenerator = vi.fn();
      const windowMs = 60000;
      const limit = 10;

      mockRateLimit.mockImplementation((config) => {
        const req = mockRequest();
        const res = mockResponse();
        const mockOptions = {} as any;

        config?.handler?.(
          req as Request,
          res as Response,
          mockNext,
          mockOptions,
        );
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      const mockError = new TooManyRequests("TOO_MANY_REQUESTS");
      mockTooManyRequests.mockReturnValue(mockError);

      limiterFactory(mockKeyGenerator, windowMs, limit);

      expect(mockTooManyRequests).toHaveBeenCalledWith("TOO_MANY_REQUESTS");
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("ipLimiter", () => {
    it("should create IP-based rate limiter", () => {
      const windowMs = 60000;
      const limit = 5;

      const mockRateLimitMiddleware = vi.fn() as any;
      mockRateLimitMiddleware.resetKey = vi.fn();
      mockRateLimitMiddleware.getKey = vi.fn();
      mockRateLimit.mockReturnValue(mockRateLimitMiddleware);

      const result = ipLimiter(windowMs, limit);

      expect(mockRateLimit).toHaveBeenCalledWith({
        windowMs,
        limit,
        keyGenerator: expect.any(Function),
        handler: expect.any(Function),
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false,
      });
      expect(result).toBe(mockRateLimitMiddleware);
    });

    it("should use IP address as key when available", () => {
      const windowMs = 60000;
      const limit = 5;
      const testIp = "192.168.1.1";

      mockRateLimit.mockImplementation((config) => {
        const req = mockRequest({ ip: testIp });
        const res = mockResponse();
        mockIpKeyGenerator.mockReturnValue("generated-ip-key");

        const key = config?.keyGenerator?.(req as Request, res as Response);
        expect(mockIpKeyGenerator).toHaveBeenCalledWith(testIp);
        expect(key).toBe("generated-ip-key");

        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      ipLimiter(windowMs, limit);
    });

    it("should return empty string when IP is undefined", () => {
      const windowMs = 60000;
      const limit = 5;

      mockRateLimit.mockImplementation((config) => {
        const req = mockRequest({ ip: undefined });
        const res = mockResponse();

        const key = config?.keyGenerator?.(req as Request, res as Response);
        expect(key).toBe("");
        expect(mockIpKeyGenerator).not.toHaveBeenCalled();

        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      ipLimiter(windowMs, limit);
    });
  });

  describe("userLimiter", () => {
    it("should create user-based rate limiter", () => {
      const windowMs = 60000;
      const limit = 10;

      const mockRateLimitMiddleware = vi.fn() as any;
      mockRateLimitMiddleware.resetKey = vi.fn();
      mockRateLimitMiddleware.getKey = vi.fn();
      mockRateLimit.mockReturnValue(mockRateLimitMiddleware);

      const result = userLimiter(windowMs, limit);

      expect(mockRateLimit).toHaveBeenCalledWith({
        windowMs,
        limit,
        keyGenerator: expect.any(Function),
        handler: expect.any(Function),
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false,
      });
      expect(result).toBe(mockRateLimitMiddleware);
    });

    it("should use user ID as key when token is valid", async () => {
      const windowMs = 60000;
      const limit = 10;

      mockRateLimit.mockImplementation((_config) => {
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockResolvedValue(mockUser);

      userLimiter(windowMs, limit);

      const rateLimitConfig = mockRateLimit.mock.calls[0]![0]!;
      const keyGenerator = rateLimitConfig.keyGenerator as (
        req: Request,
      ) => Promise<string>;

      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });

      const key = await keyGenerator(req as Request);

      expect(key).toBe(mockUser.id);
      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockAccessToken,
      );
    });

    it("should return empty string and capture error when token validation fails", async () => {
      const windowMs = 60000;
      const limit = 10;
      const tokenError = new Error("Invalid token");

      mockRateLimit.mockImplementation((_config) => {
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      mockTokenServiceGetAuthTokenOrThrow.mockImplementation(() => {
        throw tokenError;
      });

      userLimiter(windowMs, limit);

      const rateLimitConfig = mockRateLimit.mock.calls[0]![0]!;
      const keyGenerator = rateLimitConfig.keyGenerator as (
        req: Request,
      ) => Promise<string>;

      const req = mockRequest({
        headers: {},
      });

      const key = await keyGenerator(req as Request);

      expect(key).toBe("");
      expect(mockSentryCaptureException).toHaveBeenCalledWith(tokenError);
    });

    it("should return empty string and capture error when user validation fails", async () => {
      const windowMs = 60000;
      const limit = 10;
      const validationError = new Error("User validation failed");

      mockRateLimit.mockImplementation((_config) => {
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockRejectedValue(validationError);

      userLimiter(windowMs, limit);

      const rateLimitConfig = mockRateLimit.mock.calls[0]![0]!;
      const keyGenerator = rateLimitConfig.keyGenerator as (
        req: Request,
      ) => Promise<string>;

      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });

      const key = await keyGenerator(req as Request);

      expect(key).toBe("");
      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockAccessToken,
      );
      expect(mockSentryCaptureException).toHaveBeenCalledWith(validationError);
    });

    it("should handle async errors in keyGenerator", async () => {
      const windowMs = 60000;
      const limit = 10;
      const asyncError = new Error("Async error");

      mockRateLimit.mockImplementation((_config) => {
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockRejectedValue(asyncError);

      userLimiter(windowMs, limit);

      const rateLimitConfig = mockRateLimit.mock.calls[0]![0]!;
      const keyGenerator = rateLimitConfig.keyGenerator as (
        req: Request,
      ) => Promise<string>;

      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });

      const key = await keyGenerator(req as Request);

      expect(key).toBe("");
      expect(mockSentryCaptureException).toHaveBeenCalledWith(asyncError);
    });
  });

  describe("error handling", () => {
    it("should create TooManyRequests error with correct message", () => {
      const mockKeyGenerator = vi.fn();
      const windowMs = 60000;
      const limit = 10;

      mockRateLimit.mockImplementation((config) => {
        const req = mockRequest();
        const res = mockResponse();
        const mockOptions = {} as any;

        config?.handler?.(
          req as Request,
          res as Response,
          mockNext,
          mockOptions,
        );
        const mockRateLimitMiddleware = vi.fn() as any;
        mockRateLimitMiddleware.resetKey = vi.fn();
        mockRateLimitMiddleware.getKey = vi.fn();
        return mockRateLimitMiddleware;
      });

      const mockError = new TooManyRequests("TOO_MANY_REQUESTS");
      mockTooManyRequests.mockReturnValue(mockError);

      limiterFactory(mockKeyGenerator, windowMs, limit);

      expect(mockTooManyRequests).toHaveBeenCalledWith("TOO_MANY_REQUESTS");
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it("should not interfere with successful requests", () => {
      const mockKeyGenerator = vi.fn().mockReturnValue("test-key");
      const windowMs = 60000;
      const limit = 10;

      const mockRateLimitMiddleware = vi.fn() as any;
      mockRateLimitMiddleware.resetKey = vi.fn();
      mockRateLimitMiddleware.getKey = vi.fn();
      mockRateLimit.mockReturnValue(mockRateLimitMiddleware);

      const limiter = limiterFactory(mockKeyGenerator, windowMs, limit);

      expect(limiter).toBe(mockRateLimitMiddleware);
      expect(mockRateLimit).toHaveBeenCalledTimes(1);
    });
  });
});
