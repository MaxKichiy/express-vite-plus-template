import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vite-plus/test";
import * as Sentry from "@sentry/node";
import createHttpError from "http-errors";

import { globalErrorHandler } from "../../src/middlewares/error.middleware";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

const mockSentryCaptureException = Sentry.captureException as MockedFunction<
  typeof Sentry.captureException
>;

const originalEnv = process.env.NODE_ENV;

describe("globalErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should handle HTTP errors with correct status code in production", () => {
    process.env.NODE_ENV = "production";
    const req = mockRequest();
    const res = mockResponse();
    const error = createHttpError(404, "Not Found");

    globalErrorHandler(error, req as any, res as any, mockNext);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
    });
  });

  it("should handle non-HTTP errors with 500 status in development", () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error("Database connection failed");

    globalErrorHandler(error, req as any, res as any, mockNext);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
    });
  });

  it("should handle non-HTTP errors with 500 status in production", () => {
    process.env.NODE_ENV = "production";
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error("Database connection failed");

    globalErrorHandler(error, req as any, res as any, mockNext);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
    });
  });

  it("should handle errors without message", () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error();

    globalErrorHandler(error, req as any, res as any, mockNext);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
    });
  });
});
