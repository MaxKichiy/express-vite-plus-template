import { describe, it, expect, beforeEach, vi } from "vite-plus/test";
import { catchHandler } from "../../src/middlewares/catch.middleware";
import { mockNext, mockRequest, mockResponse } from "../mocks/request.mock";

describe("catchHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute controller without errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const controller = vi.fn().mockResolvedValue(undefined);

    const wrappedController = catchHandler(controller);
    await wrappedController(req as any, res as any, mockNext);

    expect(controller).toHaveBeenCalledWith(req, res);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should catch and pass errors to next middleware", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error("Controller error");
    const controller = vi.fn().mockRejectedValue(error);

    const wrappedController = catchHandler(controller);
    await wrappedController(req as any, res as any, mockNext);

    expect(controller).toHaveBeenCalledWith(req, res);
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should catch synchronous errors", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const error = new Error("Synchronous error");
    const controller = vi.fn().mockImplementation(() => {
      throw error;
    });

    const wrappedController = catchHandler(controller);
    await wrappedController(req as any, res as any, mockNext);

    expect(controller).toHaveBeenCalledWith(req, res);
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle void controller return", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const controller = vi.fn();

    const wrappedController = catchHandler(controller);
    await wrappedController(req as any, res as any, mockNext);

    expect(controller).toHaveBeenCalledWith(req, res);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
