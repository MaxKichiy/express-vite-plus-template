import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { Unauthorized } from "http-errors";
import jwt from "jsonwebtoken";

import { TokenService } from "../../src/core/services/token.service";
import { UserService } from "../../src/core/users/user.service";
import {
  mockJwtSign,
  mockJwtSignError,
  mockJwtVerifyError,
  mockJwtVerifySuccess,
} from "../mocks/external.mock";
import { mockRequest } from "../mocks/request.mock";
import { mockAccessToken, mockTokenPayload } from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

const mockJwtSignSpy = vi.spyOn(jwt, "sign");
const mockJwtVerifySpy = vi.spyOn(jwt, "verify");

const mockUserServiceFindByIdOrThrow = vi.spyOn(
  UserService.prototype,
  "findByIdOrThrow",
);

vi.mock("../../src/env", () => ({
  env: {
    ACCESS_TOKEN_EXPIRE: 1000 * 60 * 60 * 24,
    REFRESH_TOKEN_EXPIRE: 1000 * 60 * 60 * 24 * 90,
    JWT_SECRET_KEY: "test-secret-key",
  },
}));

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    vi.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate access token successfully for verified user", async () => {
      mockJwtSignSpy.mockImplementation(mockJwtSign);

      const result = await tokenService.generateAccessToken(mockUser);

      expect(result).toBe("mocked.jwt.token");
      expect(mockJwtSignSpy).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          emailVerified: true,
          role: mockUser.role,
        },
        "test-secret-key",
        { expiresIn: 1000 * 60 * 60 * 24 },
        expect.any(Function),
      );
    });

    it("should generate access token for unverified user", async () => {
      mockJwtSignSpy.mockImplementation(mockJwtSign);

      const result = await tokenService.generateAccessToken(mockUnverifiedUser);

      expect(result).toBe("mocked.jwt.token");
      expect(mockJwtSignSpy).toHaveBeenCalledWith(
        {
          id: mockUnverifiedUser.id,
          emailVerified: false,
          role: mockUnverifiedUser.role,
        },
        "test-secret-key",
        { expiresIn: 1000 * 60 * 60 * 24 },
        expect.any(Function),
      );
    });

    it("should handle JWT signing error", async () => {
      mockJwtSignSpy.mockImplementation(mockJwtSignError);

      await expect(tokenService.generateAccessToken(mockUser)).rejects.toThrow(
        "JWT signing failed",
      );
    });

    it("should handle empty token response", async () => {
      mockJwtSignSpy.mockImplementation(
        (_data, _secret, _options, callback) => {
          callback(null, "");
        },
      );

      await expect(tokenService.generateAccessToken(mockUser)).rejects.toThrow(
        "UNABLE_TO_GENERATE_TOKEN",
      );
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate refresh token successfully", async () => {
      mockJwtSignSpy.mockImplementation(mockJwtSign);

      const result = await tokenService.generateRefreshToken(mockUser);

      expect(result).toBe("mocked.jwt.token");
      expect(mockJwtSignSpy).toHaveBeenCalledWith(
        { id: mockUser.id },
        "test-secret-key",
        { expiresIn: 1000 * 60 * 60 * 24 * 90 },
        expect.any(Function),
      );
    });

    it("should handle JWT signing error for refresh token", async () => {
      mockJwtSignSpy.mockImplementation(mockJwtSignError);

      await expect(tokenService.generateRefreshToken(mockUser)).rejects.toThrow(
        "JWT signing failed",
      );
    });
  });

  describe("verifyToken", () => {
    it("should verify token successfully", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifySuccess);
      mockUserServiceFindByIdOrThrow.mockResolvedValue(mockUser);

      const result = await tokenService.verifyToken(mockAccessToken);

      expect(result).toBe(mockUser);
      expect(mockJwtVerifySpy).toHaveBeenCalledWith(
        mockAccessToken,
        "test-secret-key",
        expect.any(Function),
      );
      expect(mockUserServiceFindByIdOrThrow).toHaveBeenCalledWith(
        mockTokenPayload.id,
      );
    });

    it("should throw unauthorized for invalid token", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifyError);

      await expect(tokenService.verifyToken("invalid-token")).rejects.toThrow(
        Unauthorized,
      );
      await expect(tokenService.verifyToken("invalid-token")).rejects.toThrow(
        "UNAUTHORIZED",
      );
    });

    it("should throw unauthorized when user not found", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifySuccess);
      mockUserServiceFindByIdOrThrow.mockRejectedValue(
        new Error("User not found"),
      );

      await expect(tokenService.verifyToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
    });

    it("should handle malformed token payload", async () => {
      mockJwtVerifySpy.mockImplementation((_token, _secret, callback) => {
        (callback as any)(null, { invalidPayload: true });
      });

      await expect(tokenService.verifyToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
    });
  });

  describe("validateToken", () => {
    it("should validate token successfully", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifySuccess);
      mockUserServiceFindByIdOrThrow.mockResolvedValue(mockUser);

      const result = await tokenService.validateToken(mockAccessToken);

      expect(result).toBe(mockUser);
    });

    it("should throw invalid token error when token is falsy", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifySuccess);
      mockUserServiceFindByIdOrThrow.mockResolvedValue(null as any);

      await expect(tokenService.validateToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
      await expect(tokenService.validateToken(mockAccessToken)).rejects.toThrow(
        "INVALID_TOKEN",
      );
    });

    it("should handle verification errors", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifyError);

      await expect(tokenService.validateToken("invalid-token")).rejects.toThrow(
        Unauthorized,
      );
    });
  });

  describe("getAuthTokenOrThrow", () => {
    it("should extract token from authorization header", () => {
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${mockAccessToken}`,
        },
      });

      const result = tokenService.getAuthTokenOrThrow(req as any);

      expect(result).toBe(mockAccessToken);
    });

    it("should throw error when no authorization header", () => {
      const req = mockRequest({
        headers: {},
      });

      expect(() => tokenService.getAuthTokenOrThrow(req as any)).toThrow(
        Unauthorized,
      );
      expect(() => tokenService.getAuthTokenOrThrow(req as any)).toThrow(
        "NO_ACCESS_TOKEN_PROVIDED",
      );
    });

    it("should throw error when authorization header is malformed", () => {
      const req = mockRequest({
        headers: {
          authorization: "",
        },
      });

      expect(() => tokenService.getAuthTokenOrThrow(req as any)).toThrow();
    });

    it("should throw error when token is empty", () => {
      const req = mockRequest({
        headers: {
          authorization: "Bearer ",
        },
      });

      expect(() => tokenService.getAuthTokenOrThrow(req as any)).toThrow(
        Unauthorized,
      );
    });

    it("should handle authorization header without Bearer prefix", () => {
      const req = mockRequest({
        headers: {
          authorization: mockAccessToken,
        },
      });

      const result = tokenService.getAuthTokenOrThrow(req as any);

      expect(result).toBe(mockAccessToken);
    });
  });

  describe("error handling", () => {
    it("should handle JWT verify callback errors", async () => {
      mockJwtVerifySpy.mockImplementation((_token, _secret, callback) => {
        (callback as any)(new Error("Token expired"), null);
      });

      await expect(tokenService.verifyToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
    });

    it("should handle user service errors gracefully", async () => {
      mockJwtVerifySpy.mockImplementation(mockJwtVerifySuccess);
      mockUserServiceFindByIdOrThrow.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(tokenService.verifyToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
      expect(mockUserServiceFindByIdOrThrow).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined token payload", async () => {
      mockJwtVerifySpy.mockImplementation((_token, _secret, callback) => {
        (callback as any)(null, undefined);
      });

      await expect(tokenService.verifyToken(mockAccessToken)).rejects.toThrow(
        Unauthorized,
      );
    });
  });
});
