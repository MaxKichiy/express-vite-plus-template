import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { MeController } from "../../src/controllers/me.controller";
import { mockRequest, mockResponse } from "../mocks/request.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

describe("MeController", () => {
  let meController: MeController;

  beforeEach(() => {
    meController = new MeController();
    vi.clearAllMocks();
  });

  describe("getMe", () => {
    it("should return current user data successfully", () => {
      const req = mockRequest({ user: mockUser });
      const res = mockResponse();

      meController.getMe(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          currentUser: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            emailVerified: true,
            phoneNumber: mockUser.phoneNumber,
            phoneVerified: true,
            createdAt: mockUser.createdAt,
            updatedAt: mockUser.updatedAt,
          },
        },
      });
    });

    it("should return current user data for unverified user", () => {
      const req = mockRequest({ user: mockUnverifiedUser });
      const res = mockResponse();

      meController.getMe(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          currentUser: {
            id: mockUnverifiedUser.id,
            email: mockUnverifiedUser.email,
            firstName: mockUnverifiedUser.firstName,
            lastName: mockUnverifiedUser.lastName,
            role: mockUnverifiedUser.role,
            emailVerified: false,
            phoneNumber: mockUnverifiedUser.phoneNumber,
            phoneVerified: false,
            createdAt: mockUnverifiedUser.createdAt,
            updatedAt: mockUnverifiedUser.updatedAt,
          },
        },
      });
    });
  });
});
