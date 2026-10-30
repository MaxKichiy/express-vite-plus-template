import { describe, it, expect, beforeEach, vi, type MockedFunction } from "vite-plus/test";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import * as Sentry from "@sentry/node";

import { SESProvider } from "../../src/providers/ses.provider";
import { EmailService } from "../../src/services/email/email.service";
import { mockSESCommandError, mockSESCommandSuccess } from "../mocks/external.mock";

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
}));

vi.mock("../../src/env", () => ({
  env: {
    APP_URL: "http://localhost:3000",
    AWS_SES_SENDER: "noreply@example.com",
  },
}));

const mockSESClientSend = vi.fn();
const mockGetSesClient = vi.spyOn(SESProvider.prototype, "getSesClient").mockReturnValue({
  send: mockSESClientSend,
} as any);

const mockSentryCaptureException = Sentry.captureException as MockedFunction<
  typeof Sentry.captureException
>;

describe("EmailService", () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService();
  });

  describe("sendResetPasswordEmail", () => {
    it("should send password reset email successfully", async () => {
      const receiverEmail = "user@example.com";
      const passwordResetToken = "reset-token-123";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      const result = await emailService.sendResetPasswordEmail(receiverEmail, passwordResetToken);

      expect(result).toBe(true);
      expect(mockSESClientSend).toHaveBeenCalledTimes(1);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand).toBeInstanceOf(SendEmailCommand);
      expect(sendCommand.input.Source).toBe("noreply@example.com");
      expect(sendCommand.input.Destination?.ToAddresses).toEqual([receiverEmail]);
      expect(sendCommand.input.Message?.Subject?.Data).toBe("Reset Password");
      expect(sendCommand.input.Message?.Body?.Text?.Data).toContain(
        "http://localhost:3000/password-reset?token=reset-token-123",
      );
      expect(sendCommand.input.Message?.Body?.Html?.Data).toContain(
        "http://localhost:3000/password-reset?token=reset-token-123",
      );
    });

    it("should return false when SES send fails", async () => {
      const receiverEmail = "user@example.com";
      const passwordResetToken = "reset-token-123";

      mockSESClientSend.mockImplementation(mockSESCommandError);

      const result = await emailService.sendResetPasswordEmail(receiverEmail, passwordResetToken);

      expect(result).toBe(false);
      expect(mockSESClientSend).toHaveBeenCalledTimes(1);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should include correct reset URL in email content", async () => {
      const receiverEmail = "test@example.com";
      const passwordResetToken = "unique-token-456";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendResetPasswordEmail(receiverEmail, passwordResetToken);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      const expectedUrl = "http://localhost:3000/password-reset?token=unique-token-456";

      expect(sendCommand.input.Message?.Body?.Text?.Data).toBe(
        `Click here to reset password: ${expectedUrl}`,
      );
      expect(sendCommand.input.Message?.Body?.Html?.Data).toBe(
        `<a href="${expectedUrl}"><b>Click here to reset password</b></a>`,
      );
    });

    it("should handle special characters in token", async () => {
      const receiverEmail = "user@example.com";
      const passwordResetToken = "token-with-special-chars!@#$%";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      const result = await emailService.sendResetPasswordEmail(receiverEmail, passwordResetToken);

      expect(result).toBe(true);
      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand.input.Message?.Body?.Text?.Data).toContain(passwordResetToken);
      expect(sendCommand.input.Message?.Body?.Html?.Data).toContain(passwordResetToken);
    });

    it("should set correct email properties", async () => {
      const receiverEmail = "recipient@example.com";
      const passwordResetToken = "test-token";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendResetPasswordEmail(receiverEmail, passwordResetToken);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand.input.Source).toBe("noreply@example.com");
      expect(sendCommand.input.Destination?.ToAddresses).toEqual([receiverEmail]);
      expect(sendCommand.input.Message?.Subject?.Charset).toBe("UTF-8");
      expect(sendCommand.input.Message?.Body?.Text?.Charset).toBe("UTF-8");
      expect(sendCommand.input.Message?.Body?.Html?.Charset).toBe("UTF-8");
    });
  });

  describe("sendVerificationEmail", () => {
    it("should send verification email successfully", async () => {
      const receiverEmail = "user@example.com";
      const verificationToken = "verify-token-123";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      const result = await emailService.sendVerificationEmail(receiverEmail, verificationToken);

      expect(result).toBe(true);
      expect(mockSESClientSend).toHaveBeenCalledTimes(1);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand).toBeInstanceOf(SendEmailCommand);
      expect(sendCommand.input.Source).toBe("noreply@example.com");
      expect(sendCommand.input.Destination?.ToAddresses).toEqual([receiverEmail]);
      expect(sendCommand.input.Message?.Subject?.Data).toBe("Email Verification");
    });

    it("should return false when SES send fails", async () => {
      const receiverEmail = "user@example.com";
      const verificationToken = "verify-token-123";

      mockSESClientSend.mockImplementation(mockSESCommandError);

      const result = await emailService.sendVerificationEmail(receiverEmail, verificationToken);

      expect(result).toBe(false);
      expect(mockSESClientSend).toHaveBeenCalledTimes(1);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should include correct verification URL and token in email content", async () => {
      const receiverEmail = "test@example.com";
      const verificationToken = "unique-verify-token-789";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendVerificationEmail(receiverEmail, verificationToken);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      const expectedUrl = "http://localhost:3000/verification?token=unique-verify-token-789";

      expect(sendCommand.input.Message?.Body?.Text?.Data).toBe(
        `Click here to verify your email address: ${expectedUrl}`,
      );
      expect(sendCommand.input.Message?.Body?.Html?.Data).toBe(
        `<a href="${expectedUrl}"><center>Click here to verify your email address</center></b></a>`,
      );
    });

    it("should handle different email addresses", async () => {
      const testEmails = ["test@example.com", "user@domain.org", "admin@company.co.uk"];
      const verificationToken = "token-123";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      for (const email of testEmails) {
        const result = await emailService.sendVerificationEmail(email, verificationToken);
        expect(result).toBe(true);

        const sendCommand =
          mockSESClientSend.mock.calls[mockSESClientSend.mock.calls.length - 1]?.[0];
        expect(sendCommand.input.Destination?.ToAddresses).toEqual([email]);
      }

      expect(mockSESClientSend).toHaveBeenCalledTimes(3);
    });

    it("should handle special characters in verification token", async () => {
      const receiverEmail = "user@example.com";
      const verificationToken = "token-with-special-chars!@#$%^&*()";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      const result = await emailService.sendVerificationEmail(receiverEmail, verificationToken);

      expect(result).toBe(true);
      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand.input.Message?.Body?.Text?.Data).toContain(verificationToken);
      expect(sendCommand.input.Message?.Body?.Html?.Data).toContain(verificationToken);
    });

    it("should set correct email properties for verification", async () => {
      const receiverEmail = "recipient@example.com";
      const verificationToken = "verify-test-token";

      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendVerificationEmail(receiverEmail, verificationToken);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand.input.Source).toBe("noreply@example.com");
      expect(sendCommand.input.Destination?.ToAddresses).toEqual([receiverEmail]);
      expect(sendCommand.input.Message?.Subject?.Data).toBe("Email Verification");
      expect(sendCommand.input.Message?.Subject?.Charset).toBe("UTF-8");
      expect(sendCommand.input.Message?.Body?.Text?.Charset).toBe("UTF-8");
      expect(sendCommand.input.Message?.Body?.Html?.Charset).toBe("UTF-8");
    });
  });

  describe("error handling", () => {
    it("should capture exception and return false on SES error for password reset", async () => {
      const sesError = new Error("Network timeout");
      mockSESClientSend.mockRejectedValue(sesError);

      const result = await emailService.sendResetPasswordEmail("user@example.com", "token-123");

      expect(result).toBe(false);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(sesError);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should capture exception and return false on SES error for verification", async () => {
      const sesError = new Error("Service unavailable");
      mockSESClientSend.mockRejectedValue(sesError);

      const result = await emailService.sendVerificationEmail("user@example.com", "token-123");

      expect(result).toBe(false);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(sesError);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });

    it("should handle different types of errors", async () => {
      const errors = [
        new Error("Connection failed"),
        new TypeError("Invalid parameter"),
        new ReferenceError("Missing configuration"),
      ];

      for (const error of errors) {
        mockSESClientSend.mockRejectedValueOnce(error);

        const result = await emailService.sendResetPasswordEmail("user@example.com", "token");
        expect(result).toBe(false);
        expect(mockSentryCaptureException).toHaveBeenCalledWith(error);
      }

      expect(mockSentryCaptureException).toHaveBeenCalledTimes(3);
    });

    it("should handle SES client throwing synchronous errors", async () => {
      const syncError = new Error("Synchronous SES error");
      mockSESClientSend.mockImplementation(() => {
        throw syncError;
      });

      const result = await emailService.sendResetPasswordEmail("user@example.com", "token");

      expect(result).toBe(false);
      expect(mockSentryCaptureException).toHaveBeenCalledWith(syncError);
    });
  });

  describe("SES client integration", () => {
    it("should use SES client from provider", () => {
      expect(mockGetSesClient).toHaveBeenCalledTimes(1);
    });

    it("should create SendEmailCommand with correct structure", async () => {
      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendResetPasswordEmail("test@example.com", "test-token");

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand).toBeInstanceOf(SendEmailCommand);
      expect(sendCommand.input).toHaveProperty("Source");
      expect(sendCommand.input).toHaveProperty("Destination");
      expect(sendCommand.input).toHaveProperty("Message");
      expect(sendCommand.input.Message).toHaveProperty("Body");
      expect(sendCommand.input.Message).toHaveProperty("Subject");
    });

    it("should handle concurrent email sending", async () => {
      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      const promises = [
        emailService.sendResetPasswordEmail("user1@example.com", "token1"),
        emailService.sendVerificationEmail("user2@example.com", "token2"),
        emailService.sendResetPasswordEmail("user3@example.com", "token3"),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(mockSESClientSend).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed success and failure scenarios", async () => {
      mockSESClientSend
        .mockImplementationOnce(mockSESCommandSuccess)
        .mockImplementationOnce(mockSESCommandError)
        .mockImplementationOnce(mockSESCommandSuccess);

      const results = await Promise.all([
        emailService.sendResetPasswordEmail("success@example.com", "token1"),
        emailService.sendVerificationEmail("fail@example.com", "token2"),
        emailService.sendResetPasswordEmail("success2@example.com", "token3"),
      ]);

      expect(results).toEqual([true, false, true]);
      expect(mockSESClientSend).toHaveBeenCalledTimes(3);
      expect(mockSentryCaptureException).toHaveBeenCalledTimes(1);
    });
  });

  describe("email content validation", () => {
    it("should generate different URLs for different tokens", async () => {
      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendResetPasswordEmail("user@example.com", "token1");
      await emailService.sendVerificationEmail("user@example.com", "token2");

      const resetCommand = mockSESClientSend.mock.calls[0]?.[0];
      const verifyCommand = mockSESClientSend.mock.calls[1]?.[0];

      expect(resetCommand.input.Message?.Body?.Text?.Data).toContain("password-reset?token=token1");
      expect(verifyCommand.input.Message?.Body?.Text?.Data).toContain("verification?token=token2");
    });

    it("should preserve token integrity in URLs", async () => {
      const complexToken = "abc123-DEF456_ghi789.jkl";
      mockSESClientSend.mockImplementation(mockSESCommandSuccess);

      await emailService.sendResetPasswordEmail("user@example.com", complexToken);

      const sendCommand = mockSESClientSend.mock.calls[0]?.[0];
      expect(sendCommand.input.Message?.Body?.Text?.Data).toContain(`token=${complexToken}`);
      expect(sendCommand.input.Message?.Body?.Html?.Data).toContain(`token=${complexToken}`);
    });
  });
});
