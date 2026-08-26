import { describe, expect, it, vi } from "vitest";

const sendMailMock = vi.hoisted(() => vi.fn(async () => ({ messageId: "test-message" })));
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

import { getTitanSmtpConfig, redactTitanSmtpConfig, sendOperationalDigestEmail, sendTitanEmail, shouldSendNotificationDigest } from "./email";

describe("Titan SMTP configuration", () => {
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
