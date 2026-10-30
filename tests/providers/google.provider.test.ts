import { describe, it, expect, beforeEach, vi, type MockedClass } from "vite-plus/test";
import { OAuth2Client } from "google-auth-library";

import { GoogleProvider } from "../../src/providers/google.provider";

vi.mock("google-auth-library");

vi.mock("../../src/env", () => ({
  env: {
    GOOGLE_OAUTH_CLIENT_ID: "test-google-client-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "test-google-client-secret",
  },
}));

const mockOAuth2Client = OAuth2Client as MockedClass<typeof OAuth2Client>;

describe("GoogleProvider", () => {
  let googleProvider: GoogleProvider;

  beforeEach(() => {
    googleProvider = new GoogleProvider();
    vi.clearAllMocks();
  });

  describe("getGoogleClient", () => {
    it("should create and return OAuth2Client with correct configuration", () => {
      const mockClientInstance = {
        verifyIdToken: vi.fn(),
        generateAuthUrl: vi.fn(),
        getTokens: vi.fn(),
      } as any;

      mockOAuth2Client.mockImplementation(() => mockClientInstance);

      const result = googleProvider.getGoogleClient();

      expect(OAuth2Client).toHaveBeenCalledWith(
        "test-google-client-id",
        "test-google-client-secret",
      );
      expect(result).toBe(mockClientInstance);
    });

    it("should create new OAuth2Client instance on each call", () => {
      const mockClientInstance1 = { id: 1 } as any;
      const mockClientInstance2 = { id: 2 } as any;

      mockOAuth2Client
        .mockImplementationOnce(() => mockClientInstance1)
        .mockImplementationOnce(() => mockClientInstance2);

      const result1 = googleProvider.getGoogleClient();
      const result2 = googleProvider.getGoogleClient();

      expect(OAuth2Client).toHaveBeenCalledTimes(2);
      expect(result1).toBe(mockClientInstance1);
      expect(result2).toBe(mockClientInstance2);
    });

    it("should use environment variables for client configuration", () => {
      const mockClientInstance = {} as any;
      mockOAuth2Client.mockImplementation(() => mockClientInstance);

      googleProvider.getGoogleClient();

      expect(OAuth2Client).toHaveBeenCalledWith(
        "test-google-client-id",
        "test-google-client-secret",
      );
    });

    it("should handle OAuth2Client constructor errors", () => {
      const constructorError = new Error("OAuth2Client constructor failed");
      mockOAuth2Client.mockImplementation(() => {
        throw constructorError;
      });

      expect(() => googleProvider.getGoogleClient()).toThrow(constructorError);
      expect(OAuth2Client).toHaveBeenCalledWith(
        "test-google-client-id",
        "test-google-client-secret",
      );
    });
  });

  describe("multiple provider instances", () => {
    it("should work correctly with multiple provider instances", () => {
      const provider1 = new GoogleProvider();
      const provider2 = new GoogleProvider();

      const mockClientInstance = {} as any;
      mockOAuth2Client.mockImplementation(() => mockClientInstance);

      const client1 = provider1.getGoogleClient();
      const client2 = provider2.getGoogleClient();

      expect(OAuth2Client).toHaveBeenCalledTimes(2);
      expect(client1).toBe(mockClientInstance);
      expect(client2).toBe(mockClientInstance);
    });
  });
});
