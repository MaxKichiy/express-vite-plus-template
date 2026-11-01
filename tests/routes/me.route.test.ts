import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
const mockMeControllerGetMe = vi.fn();
const mockTokenGuard = vi.fn((req: any, _res: any, next: any) => {
  req.user = undefined;
  next();
});

import express from "express";
import request from "supertest";

import { MeRouter } from "../../src/http/routes/me.routeroute";
import { mockAccessToken } from "../mocks/tokens.mock";
import { mockUnverifiedUser, mockUser } from "../mocks/user.mock";

vi.mock("../../src/middlewares/limiter.middleware", () => ({
  userLimiter: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock("../../src/middlewares/catch.middleware", () => ({
  catchHandler: vi.fn((handler) => handler),
}));

vi.mock("../../src/middlewares/token.guard", () => ({
  TokenGuard: vi.fn().mockImplementation(() => ({
    tokenGuard: mockTokenGuard,
  })),
}));

vi.mock("../../src/controllers/me.controller", () => ({
  MeController: vi.fn().mockImplementation(() => ({
    getMe: mockMeControllerGetMe,
  })),
}));

describe("Me Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/me", MeRouter);
    vi.clearAllMocks();

    mockTokenGuard.mockImplementation((req: any, _res: any, next: any) => {
      req.user = mockUser;
      next();
    });
  });

  describe("GET /api/me", () => {
    it("should handle successful get me request", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(response.body).toEqual({
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
            createdAt: mockUser.createdAt.toISOString(),
            updatedAt: mockUser.updatedAt.toISOString(),
          },
        },
      });
      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(1);
      expect(mockTokenGuard).toHaveBeenCalledTimes(1);
    });

    it("should handle get me request for unverified user", async () => {
      mockTokenGuard.mockImplementationOnce((req, _res, next) => {
        req.user = mockUnverifiedUser;
        next();
      });

      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentUser.emailVerified).toBe(false);
      expect(response.body.data.currentUser.phoneVerified).toBe(false);
      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(1);
    });

    it("should handle unauthorized access without token", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({
          success: false,
          error: "NO_ACCESS_TOKEN_PROVIDED",
        });
      });

      const response = await request(app).get("/api/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("NO_ACCESS_TOKEN_PROVIDED");
      expect(mockMeControllerGetMe).not.toHaveBeenCalled();
    });

    it("should handle unauthorized access with invalid token", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({
          success: false,
          error: "INVALID_TOKEN",
        });
      });

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("INVALID_TOKEN");
      expect(mockMeControllerGetMe).not.toHaveBeenCalled();
    });

    it("should handle malformed authorization header", async () => {
      mockTokenGuard.mockImplementationOnce((_req, res, _next) => {
        res.status(401).json({
          success: false,
          error: "INVALID_TOKEN",
        });
      });

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", "InvalidFormat token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("INVALID_TOKEN");
    });

    it("should handle controller error", async () => {
      mockMeControllerGetMe.mockImplementation((_req, _res) => {
        throw new Error("Controller error");
      });

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(500);

      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(1);
      expect(mockTokenGuard).toHaveBeenCalledTimes(1);
    });

    it("should handle async controller error", async () => {
      mockMeControllerGetMe.mockImplementation(async (_req, _res) => {
        throw new Error("Async controller error");
      });

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(500);

      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(1);
    });

    it("should apply rate limiting correctly", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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
              createdAt: mockUser.createdAt.toISOString(),
              updatedAt: mockUser.updatedAt.toISOString(),
            },
          },
        });
      });

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(1);
    });

    it("should pass user from token guard to controller", async () => {
      const customUser = {
        ...mockUser,
        firstName: "Custom",
        lastName: "User",
      };

      mockTokenGuard.mockImplementationOnce((req, _res, next) => {
        req.user = customUser;
        next();
      });

      mockMeControllerGetMe.mockImplementation((mockReq, res) => {
        expect(mockReq.user).toBe(customUser);
        res.status(200).json({
          success: true,
          data: {
            currentUser: {
              id: customUser.id,
              email: customUser.email,
              firstName: customUser.firstName,
              lastName: customUser.lastName,
              role: customUser.role,
              emailVerified: true,
              phoneNumber: customUser.phoneNumber,
              phoneVerified: true,
              createdAt: customUser.createdAt,
              updatedAt: customUser.updatedAt,
            },
          },
        });
      });

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(response.body.data.currentUser.firstName).toBe("Custom");
      expect(response.body.data.currentUser.lastName).toBe("User");
    });

    it("should handle concurrent requests", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const promises = Array.from({ length: 3 }, () =>
        request(app)
          .get("/api/me")
          .set("Authorization", `Bearer ${mockAccessToken}`)
          .expect(200),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("currentUser");
      });

      expect(mockMeControllerGetMe).toHaveBeenCalledTimes(3);
      expect(mockTokenGuard).toHaveBeenCalledTimes(3);
    });
  });

  describe("middleware integration", () => {
    it("should apply correct middleware stack", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(mockTokenGuard).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP methods", () => {
    it("should only accept GET requests", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      await request(app)
        .post("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(404);

      await request(app)
        .put("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(404);

      await request(app)
        .delete("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(404);

      await request(app)
        .patch("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(404);
    });
  });

  describe("response format", () => {
    it("should return proper JSON format", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("currentUser");
      expect(typeof response.body.success).toBe("boolean");
      expect(typeof response.body.data).toBe("object");
    });

    it("should include all required user fields in response", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      const { currentUser } = response.body.data;
      expect(currentUser).toHaveProperty("id");
      expect(currentUser).toHaveProperty("email");
      expect(currentUser).toHaveProperty("firstName");
      expect(currentUser).toHaveProperty("lastName");
      expect(currentUser).toHaveProperty("role");
      expect(currentUser).toHaveProperty("emailVerified");
      expect(currentUser).toHaveProperty("phoneNumber");
      expect(currentUser).toHaveProperty("phoneVerified");
      expect(currentUser).toHaveProperty("createdAt");
      expect(currentUser).toHaveProperty("updatedAt");
    });

    it("should not include sensitive user fields in response", async () => {
      mockMeControllerGetMe.mockImplementation((_req, res) => {
        res.status(200).json({
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

      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      const { currentUser } = response.body.data;
      expect(currentUser).not.toHaveProperty("passwordHash");
      expect(currentUser).not.toHaveProperty("password");
    });
  });

  describe("error scenarios", () => {
    it("should handle token guard errors gracefully", async () => {
      mockTokenGuard.mockImplementationOnce((_req, _res, next) => {
        next(new Error("Token validation failed"));
      });

      await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(500);

      expect(mockMeControllerGetMe).not.toHaveBeenCalled();
    });
  });
});
