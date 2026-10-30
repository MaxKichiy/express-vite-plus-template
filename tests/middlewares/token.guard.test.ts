import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { Unauthorized } from "http-errors";

import { TokenGuard } from "../../src/middlewares/token.guard";
import { TokenService } from "../../src/core/services/token.service";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";
import { mockAccessToken } from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

const mockTokenServiceGetAuthTokenOrThrow = vi.spyOn(
  TokenService.prototype,
  "getAuthTokenOrThrow",
);
const mockTokenServiceValidateToken = vi.spyOn(
  TokenService.prototype,
  "validateToken",
);

describe("TokenGuard", () => {
  let tokenGuard: TokenGuard;

  beforeEach(() => {
    tokenGuard = new TokenGuard();
    vi.clearAllMocks();
  });

  describe("tokenGuard", () => {
    it("should authenticate user successfully", async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });
      const res = mockResponse();

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockResolvedValue(mockUser);

      await tokenGuard.authenticate(req as any, res as any, mockNext);

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockAccessToken,
      );
      expect(req.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle missing token", async () => {
      const req = mockRequest({
        headers: {},
      });
      const res = mockResponse();
      const tokenError = new Unauthorized("NO_ACCESS_TOKEN_PROVIDED");

      mockTokenServiceGetAuthTokenOrThrow.mockImplementation(() => {
        throw tokenError;
      });

      await tokenGuard.authenticate(req as any, res as any, mockNext);

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });

    it("should handle invalid token", async () => {
      const req = mockRequest({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = mockResponse();
      const validationError = new Unauthorized("INVALID_TOKEN");

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue("invalid-token");
      mockTokenServiceValidateToken.mockRejectedValue(validationError);

      await tokenGuard.authenticate(req as any, res as any, mockNext);

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        "invalid-token",
      );
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle token service throwing error", async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });
      const res = mockResponse();
      const serviceError = new Error("Token service error");

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockRejectedValue(serviceError);

      await tokenGuard.authenticate(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("tokenGuardWithEmailVerification", () => {
    it("should authenticate verified user successfully", async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });
      const res = mockResponse();

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockResolvedValue(mockUser);

      await tokenGuard.authenticateWithEmailVerification(
        req as any,
        res as any,
        mockNext,
      );

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockAccessToken,
      );
      expect(req.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should reject unverified user", async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });
      const res = mockResponse();

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockResolvedValue(mockUnverifiedUser);

      await tokenGuard.authenticateWithEmailVerification(
        req as any,
        res as any,
        mockNext,
      );

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        mockAccessToken,
      );
      expect(req.user).toBe(mockUnverifiedUser);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "EMAIL_NOT_VERIFIED",
          statusCode: 401,
        }),
      );
    });

    it("should handle missing token", async () => {
      const req = mockRequest({
        headers: {},
      });
      const res = mockResponse();
      const tokenError = new Unauthorized("NO_ACCESS_TOKEN_PROVIDED");

      mockTokenServiceGetAuthTokenOrThrow.mockImplementation(() => {
        throw tokenError;
      });

      await tokenGuard.authenticateWithEmailVerification(
        req as any,
        res as any,
        mockNext,
      );

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });

    it("should handle invalid token", async () => {
      const req = mockRequest({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = mockResponse();
      const validationError = new Unauthorized("INVALID_TOKEN");

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue("invalid-token");
      mockTokenServiceValidateToken.mockRejectedValue(validationError);

      await tokenGuard.authenticateWithEmailVerification(
        req as any,
        res as any,
        mockNext,
      );

      expect(mockTokenServiceGetAuthTokenOrThrow).toHaveBeenCalledWith(req);
      expect(mockTokenServiceValidateToken).toHaveBeenCalledWith(
        "invalid-token",
      );
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle user without emailVerifiedAt field", async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${mockAccessToken}` },
      });
      const res = mockResponse();
      const userWithoutEmailField = { ...mockUser, emailVerifiedAt: undefined };

      mockTokenServiceGetAuthTokenOrThrow.mockReturnValue(mockAccessToken);
      mockTokenServiceValidateToken.mockResolvedValue(
        userWithoutEmailField as any,
      );

      await tokenGuard.authenticateWithEmailVerification(
        req as any,
        res as any,
        mockNext,
      );

      expect(req.user).toBe(userWithoutEmailField);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "EMAIL_NOT_VERIFIED",
          statusCode: 401,
        }),
      );
    });
  });
});
