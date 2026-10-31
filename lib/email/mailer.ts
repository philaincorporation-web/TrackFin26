import "server-only";
import { createTransport } from "nodemailer";
import { readEmailConfig } from "@/lib/email/config";

export type EmailMessage = { to: { email: string; name?: string | null }; subject: string; html: string; text: string };

export type SendResult = { sent: true; messageId: string } | { sent: false; reason: string };

/**
 * Envoie un e-mail. Ne lève jamais d'exception : l'échec d'un envoi ne doit
 * pas annuler l'opération métier (ex. l'invitation reste valable et le code
 * peut être transmis à la main). Délais courts pour ne pas bloquer l'écran.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const result = readEmailConfig();
  if (!result.ok) {
    return { sent: false, reason: `Envoi d'e-mails non configuré (variables manquantes : ${result.missing.join(", ")}).` };
  }
  const { config } = result;

  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    const info = await transport.sendMail({
      from: { name: config.from.name, address: config.from.address },
      to: message.to.name ? { name: message.to.name, address: message.to.email } : message.to.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { sent: true, messageId: String(info.messageId ?? "") };
  } catch (error) {
    console.error("Échec d'envoi d'e-mail :", error);
    return { sent: false, reason: describeSmtpError(error) };
  } finally {
    transport.close();
  }
}

/** Message compréhensible pour l'administrateur (sans détail technique sensible). */
function describeSmtpError(error: unknown): string {
  const e = error as { code?: string; responseCode?: number };
  if (e?.code === "EAUTH" || e?.responseCode === 535) {
    return "Le serveur d'envoi a refusé l'identifiant ou le mot de passe d'application (SMTP_USER / SMTP_PASSWORD).";
  }
  if (e?.code === "ETIMEDOUT" || e?.code === "ECONNECTION" || e?.code === "ESOCKET") {
    return "Impossible de joindre le serveur d'envoi pour le moment.";
  }
  if (e?.code === "EENVELOPE") return "L'adresse du destinataire a été refusée.";
  return "L'e-mail n'a pas pu être envoyé.";
}
