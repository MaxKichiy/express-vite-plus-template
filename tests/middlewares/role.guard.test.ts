import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { Forbidden } from "http-errors";

import { UserRole } from "../../src/generated/prisma/client";
import { roleGuard } from "../../src/http/middlewares/role.guard";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";
import { mockAdminUser, mockUser } from "../mocks/user.mock";

describe("roleGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access for user with correct role", () => {
    const req = mockRequest({ user: mockAdminUser });
    const res = mockResponse();
    const guard = roleGuard([UserRole.ADMIN]);

    guard(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should allow access for user with any of the allowed roles", () => {
    const req = mockRequest({ user: mockUser });
    const res = mockResponse();
    const guard = roleGuard([UserRole.USER, UserRole.ADMIN]);

    guard(req as any, res as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should deny access for user with incorrect role", () => {
    const req = mockRequest({ user: mockUser });
    const res = mockResponse();
    const guard = roleGuard([UserRole.ADMIN]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow(Forbidden);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should deny access when user is not present in request", () => {
    const req = mockRequest({ user: undefined });
    const res = mockResponse();
    const guard = roleGuard([UserRole.USER]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow(Forbidden);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should deny access when user is undefined", () => {
    const req = mockRequest({ user: undefined });
    const res = mockResponse();
    const guard = roleGuard([UserRole.USER]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow(Forbidden);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should allow admin access to user-only endpoints", () => {
    const req = mockRequest({ user: mockAdminUser });
    const res = mockResponse();
    const guard = roleGuard([UserRole.USER]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow(Forbidden);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle empty allowed roles array", () => {
    const req = mockRequest({ user: mockUser });
    const res = mockResponse();
    const guard = roleGuard([]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow(Forbidden);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should throw correct error message", () => {
    const req = mockRequest({ user: mockUser });
    const res = mockResponse();
    const guard = roleGuard([UserRole.ADMIN]);

    expect(() => {
      guard(req as any, res as any, mockNext);
    }).toThrow("FORBIDDEN");
  });
});
