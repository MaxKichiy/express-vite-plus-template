import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { z } from "zod";

import { validate } from "../../src/middlewares/validate.middleware";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";

describe("validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and pass valid request", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        name: z.string(),
      }),
    });

    const req = mockRequest({
      body: {
        email: "test@example.com",
        name: "John Doe",
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(req.body).toEqual({
      email: "test@example.com",
      name: "John Doe",
    });
    expect(mockNext).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should validate and coerce data types", async () => {
    const schema = z.object({
      body: z.object({
        age: z.coerce.number(),
        isActive: z.coerce.boolean(),
      }),
    });

    const req = mockRequest({
      body: {
        age: "25",
        isActive: "true",
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(req.body).toEqual({
      age: 25,
      isActive: true,
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should validate params and query", async () => {
    const schema = z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
      query: z.object({
        limit: z.coerce.number(),
      }),
    });

    const req = mockRequest({
      params: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
      query: {
        limit: "10",
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(req.params).toEqual({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(req.query).toEqual({
      limit: 10,
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should return validation errors for invalid data", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        age: z.number().min(18),
      }),
    });

    const req = mockRequest({
      body: {
        email: "invalid-email",
        age: 16,
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({
          field: "body.email",
          message: "Invalid email address",
        }),
        expect.objectContaining({
          field: "body.age",
          message: "Too small: expected number to be >=18",
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return validation error for missing required field", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    });

    const req = mockRequest({
      body: {
        email: "test@example.com",
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({
          field: "body.password",
          message: "Invalid input: expected string, received undefined",
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle nested field validation errors", async () => {
    const schema = z.object({
      body: z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string().min(2),
            lastName: z.string().min(2),
          }),
        }),
      }),
    });

    const req = mockRequest({
      body: {
        user: {
          profile: {
            firstName: "A",
            lastName: "",
          },
        },
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INVALID_DATA",
      details: expect.arrayContaining([
        expect.objectContaining({
          field: "body.user.profile.firstName",
          message: "Too small: expected string to have >=2 characters",
        }),
        expect.objectContaining({
          field: "body.user.profile.lastName",
          message: "Too small: expected string to have >=2 characters",
        }),
      ]),
    });
  });

  it("should handle optional fields", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        phoneNumber: z.string().optional(),
      }),
    });

    const req = mockRequest({
      body: {
        email: "test@example.com",
      },
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(req.body).toEqual({
      email: "test@example.com",
    });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should not modify request when validation data is undefined", async () => {
    const schema = z.object({});

    const originalBody = { existing: "data" };
    const originalParams = { id: "123" };
    const originalQuery = { search: "test" };

    const req = mockRequest({
      body: originalBody,
      params: originalParams,
      query: originalQuery,
    });
    const res = mockResponse();

    const validator = validate(schema);
    await validator(req as any, res as any, mockNext);

    expect(req.body).toBe(originalBody);
    expect(req.params).toBe(originalParams);
    expect(req.query).toBe(originalQuery);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
