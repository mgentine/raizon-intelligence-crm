import { describe, expect, it } from "vitest";
import { getTitanSmtpConfig, redactTitanSmtpConfig, shouldSendNotificationDigest, sendOperationalDigestEmail } from "./email";

describe("Titan SMTP configuration", () => {
  it("does not send a digest when no new notifications were created", async () => {
    expect(shouldSendNotificationDigest(0)).toBe(false);
    await expect(sendOperationalDigestEmail({ createdCount: 0, blockedAttemptCount: 2 })).resolves.toEqual({ sent: false, skipped: true });
  });

  it("reads the injected credentials without exposing the password", () => {
    const config = getTitanSmtpConfig();
    expect(config.host).toBe("smtp.titan.email");
    expect(config.port).toBe(465);
    expect(config.secure).toBe(true);
    expect(config.user).toBeTruthy();
    expect(config.password).toBeTruthy();
    expect(config.recipients.length).toBeGreaterThan(0);
    expect(JSON.stringify(redactTitanSmtpConfig(config))).not.toContain(config.password);
  });
});
