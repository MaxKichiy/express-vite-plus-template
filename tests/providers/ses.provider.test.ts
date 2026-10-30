import { describe, it, expect, beforeEach, vi, type MockedClass } from "vite-plus/test";
import { SESClient } from "@aws-sdk/client-ses";

import { SESProvider } from "../../src/providers/ses.provider";

vi.mock("@aws-sdk/client-ses");

vi.mock("../../src/env", () => ({
  env: {
    AWS_SES_REGION: "us-east-1",
  },
}));

const mockSESClient = SESClient as MockedClass<typeof SESClient>;

describe("SESProvider", () => {
  let sesProvider: SESProvider;

  beforeEach(() => {
    sesProvider = new SESProvider();
    vi.clearAllMocks();
  });

  describe("getSesClient", () => {
    it("should create and return SESClient with correct configuration", () => {
      const mockClientInstance = {
        send: vi.fn(),
        config: {
          region: "us-east-1",
        },
      } as any;

      mockSESClient.mockImplementation(() => mockClientInstance);

      const result = sesProvider.getSesClient();

      expect(SESClient).toHaveBeenCalledWith({ region: "us-east-1" });
      expect(result).toBe(mockClientInstance);
    });

    it("should create new SESClient instance on each call", () => {
      const mockClientInstance1 = { id: 1 } as any;
      const mockClientInstance2 = { id: 2 } as any;

      mockSESClient
        .mockImplementationOnce(() => mockClientInstance1)
        .mockImplementationOnce(() => mockClientInstance2);

      const result1 = sesProvider.getSesClient();
      const result2 = sesProvider.getSesClient();

      expect(SESClient).toHaveBeenCalledTimes(2);
      expect(result1).toBe(mockClientInstance1);
      expect(result2).toBe(mockClientInstance2);
    });

    it("should use environment variable for region configuration", () => {
      const mockClientInstance = {} as any;
      mockSESClient.mockImplementation(() => mockClientInstance);

      sesProvider.getSesClient();

      expect(SESClient).toHaveBeenCalledWith({ region: "us-east-1" });
    });

    it("should handle SESClient constructor errors", () => {
      const constructorError = new Error("SESClient constructor failed");
      mockSESClient.mockImplementation(() => {
        throw constructorError;
      });

      expect(() => sesProvider.getSesClient()).toThrow(constructorError);
      expect(SESClient).toHaveBeenCalledWith({ region: "us-east-1" });
    });

    it("should pass through AWS SDK configuration options", () => {
      const mockClientInstance = {
        config: {
          region: "us-east-1",
        },
      } as any;

      mockSESClient.mockImplementation((config?) => {
        expect(config).toEqual({ region: "us-east-1" });
        return mockClientInstance;
      });

      const result = sesProvider.getSesClient();

      expect(result).toBe(mockClientInstance);
      expect(SESClient).toHaveBeenCalledWith({ region: "us-east-1" });
    });
  });

  describe("multiple provider instances", () => {
    it("should work correctly with multiple provider instances", () => {
      const provider1 = new SESProvider();
      const provider2 = new SESProvider();

      const mockClientInstance = {} as any;
      mockSESClient.mockImplementation(() => mockClientInstance);

      const client1 = provider1.getSesClient();
      const client2 = provider2.getSesClient();

      expect(SESClient).toHaveBeenCalledTimes(2);
      expect(client1).toBe(mockClientInstance);
      expect(client2).toBe(mockClientInstance);
    });
  });

  describe("client functionality", () => {
    it("should return client capable of sending commands", () => {
      const mockSendMethod = vi.fn();
      const mockClientInstance = {
        send: mockSendMethod,
      } as any;

      mockSESClient.mockImplementation(() => mockClientInstance);

      const client = sesProvider.getSesClient();

      expect(client.send).toBe(mockSendMethod);
      expect(typeof client.send).toBe("function");
    });
  });
});
