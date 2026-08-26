import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.hoisted(() => vi.fn(async () => ({ messageId: "test-message" })));
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

import { getTitanSmtpConfig, getTitanSmtpErrorMessage, redactTitanSmtpConfig, sendOperationalDigestEmail, sendTitanEmail, shouldSendNotificationDigest } from "./email";

describe("Titan SMTP configuration", () => {
  beforeEach(() => {
    sendMailMock.mockClear();
  });
  it("maps authentication failure 535 to safe operational guidance", () => {
    const password = "senha-super-secreta";
    const message = getTitanSmtpErrorMessage({ responseCode: 535, message: `Invalid login: 535 ${password}` });
    expect(message).toContain("autenticação SMTP (535)");
    expect(message).toContain("senha de aplicativo");
    expect(message).not.toContain(password);
    expect(message).not.toContain("TITAN_SMTP_PASSWORD");
  });

  it("sanitizes a raw 535 returned by the SMTP transport", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("Invalid login: 535 internal-password-fragment"));
    await expect(sendTitanEmail({ subject: "Teste", text: "Teste" })).rejects.toThrow("autenticação SMTP (535)");
    await expect(sendTitanEmail({ subject: "Teste", text: "Teste" })).resolves.toEqual({ messageId: "test-message" });
  });

  it("maps connection failures without returning the raw server response", () => {
    const message = getTitanSmtpErrorMessage(new Error("connect ETIMEDOUT internal-secret"));
    expect(message).toContain("conectar ao servidor SMTP Titan");
    expect(message).not.toContain("internal-secret");
  });
  it("does not send a digest when no new notifications were created", async () => {
    expect(shouldSendNotificationDigest(0)).toBe(false);
    await expect(sendOperationalDigestEmail({ createdCount: 0, blockedAttemptCount: 2 })).resolves.toEqual({ sent: false, skipped: true });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("sends through the configured Titan mailbox without exposing the password", async () => {
    const config = getTitanSmtpConfig();
    expect(config.host).toBe("smtp.titan.email");
    expect(config.port).toBe(465);
    expect(config.secure).toBe(true);
    expect(config.user).toBeTruthy();
    expect(config.password).toBeTruthy();
    expect(config.recipients.length).toBeGreaterThan(0);
    expect(JSON.stringify(redactTitanSmtpConfig(config))).not.toContain(config.password);

    await expect(sendTitanEmail({ subject: "Teste controlado", text: "Mensagem de teste" })).resolves.toEqual({ messageId: "test-message" });
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      from: config.user,
      to: config.recipients,
      subject: "Teste controlado",
      text: "Mensagem de teste",
    }));
  });
});
