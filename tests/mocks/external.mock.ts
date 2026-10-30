import { vi } from "vite-plus/test";
export const mockBcryptjsCompareSuccess = vi.fn().mockResolvedValue(true);
export const mockBcryptjsCompareFail = vi.fn().mockResolvedValue(false);
export const mockBcryptjsHash = vi
  .fn()
  .mockResolvedValue("$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2JZWxYNe0i");

export const mockJwtSign = vi.fn().mockImplementation((_data, _secret, _options, callback) => {
  callback(null, "mocked.jwt.token");
});

export const mockJwtSignError = vi
  .fn()
  .mockImplementation((_data, _secret, _options, callback) => {
    callback(new Error("JWT signing failed"));
  });

export const mockJwtVerifySuccess = vi.fn().mockImplementation((_token, _secret, callback) => {
  callback(null, {
    id: "123e4567-e89b-12d3-a456-426614174000",
    emailVerified: true,
    role: "USER",
  });
});

export const mockJwtVerifyError = vi.fn().mockImplementation((_token, _secret, callback) => {
  callback(new Error("Invalid token"));
});

export const mockGooglePayload = {
  sub: "google-account-id-123",
  email: "john.doe@example.com",
  given_name: "John",
  family_name: "Doe",
  email_verified: true,
};

export const mockGoogleTicket = {
  getPayload: vi.fn().mockReturnValue(mockGooglePayload),
};

export const mockGoogleClientVerifyIdToken = vi.fn().mockResolvedValue(mockGoogleTicket);

export const mockSESCommandSuccess = vi.fn().mockResolvedValue({ MessageId: "message-id-123" });
export const mockSESCommandError = vi.fn().mockRejectedValue(new Error("SES send failed"));

export const mockSentryCapture = vi.fn();

export const mockConsoleInfo = vi.fn();
export const mockConsoleError = vi.fn();
