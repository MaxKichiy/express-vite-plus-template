import { vi } from "vite-plus/test";
import { Request, Response } from "express";

import { mockUser } from "./user.mock";

export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  cookies: {},
  user: mockUser,
  ip: "127.0.0.1",
  ...overrides,
});

export const mockResponse = (overrides: Partial<Response> = {}): Partial<Response> => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return res;
};

export const mockNext = vi.fn();
