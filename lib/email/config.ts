/**
 * Configuration d'envoi d'e-mails (SMTP), lue dans les variables
 * d'environnement. Générique : Gmail aujourd'hui, un autre fournisseur SMTP
 * (AhaSend, Brevo…) demain sans changer le code.
 *
 *   SMTP_HOST=smtp.gmail.com   SMTP_PORT=465
 *   SMTP_USER=adresse@gmail.com   SMTP_PASSWORD=<mot de passe d'application>
 *   MAIL_FROM_NAME="DIWAA Finance · DigiWomen School"   (facultatif)
 *   MAIL_FROM_ADDRESS=...   (facultatif, par défaut SMTP_USER)
 */
export type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: { name: string; address: string };
};

export type EmailConfigResult = { ok: true; config: EmailConfig } | { ok: false; missing: string[] };

export function readEmailConfig(env: Record<string, string | undefined> = process.env): EmailConfigResult {
  const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] as const;
  const missing: string[] = required.filter((key) => !env[key]?.trim());
  const port = Number(env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port <= 0) missing.push("SMTP_PORT (nombre)");
  if (missing.length > 0) return { ok: false, missing };

  const user = env.SMTP_USER!.trim();
  return {
    ok: true,
    config: {
      host: env.SMTP_HOST!.trim(),
      port,
      // 465 : TLS dès la connexion ; 587 / 2525 : STARTTLS.
      secure: port === 465,
      user,
      // Les mots de passe d'application Google s'affichent par groupes de 4 : espaces retirés.
      password: env.SMTP_PASSWORD!.replace(/\s+/g, ""),
      from: {
        name: env.MAIL_FROM_NAME?.trim() || "DIWAA Finance · DigiWomen School",
        address: env.MAIL_FROM_ADDRESS?.trim() || user,
      },
    },
  };
}
