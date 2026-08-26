import nodemailer from "nodemailer";

export type TitanSmtpConfig = {
  host: "smtp.titan.email";
  port: 465;
  secure: true;
  user: string;
  password: string;
  recipients: string[];
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável ${name} não configurada`);
  return value;
}

export function getTitanSmtpConfig(): TitanSmtpConfig {
  return {
    host: "smtp.titan.email",
    port: 465,
    secure: true,
    user: requiredEnv("TITAN_SMTP_USER"),
    password: requiredEnv("TITAN_SMTP_PASSWORD"),
    recipients: requiredEnv("TITAN_NOTIFICATION_RECIPIENTS")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean),
  };
}

export function redactTitanSmtpConfig(config: TitanSmtpConfig) {
  return { ...config, password: "[REDACTED]" };
}

export function shouldSendNotificationDigest(createdCount: number) {
  return createdCount > 0;
}

export async function sendOperationalDigestEmail(input: { createdCount: number; blockedAttemptCount: number }) {
  if (!shouldSendNotificationDigest(input.createdCount)) return { sent: false, skipped: true } as const;
  return sendTitanEmail({
    subject: `[Raizon CRM] ${input.createdCount} novo(s) alerta(s) operacional(is)`,
    text: [
      "Resumo automático do Raizon Intelligence CRM.",
      `Novos alertas criados: ${input.createdCount}.`,
      `Tentativas de fonte bloqueadas nesta execução: ${input.blockedAttemptCount}.`,
      "Acesse o CRM para revisar a fila operacional e os detalhes.",
    ].join("\\n"),
  }).then((info) => ({ sent: true, skipped: false, messageId: info.messageId }));
}

export async function sendTitanEmail(input: { subject: string; text: string; html?: string }) {
  const config = getTitanSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return transporter.sendMail({
    from: config.user,
    to: config.recipients,
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  });
}
