import { ROLE_LABELS, type Role } from "@/lib/authz/policy";

export type InvitationEmailData = {
  name: string | null;
  role: Role;
  code: string;
  link: string;
  expiresAt: Date;
  /** Adresse publique de l'application, pour le logo (absente en local : pas de logo). */
  origin?: string;
};

/** Échappe le texte inséré dans le HTML (nom saisi par l'administrateur, etc.). */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Libreville" });

/** E-mail d'invitation : version HTML (mise en page simple et compatible) et texte brut. */
export function invitationEmail(data: InvitationEmailData) {
  const role = ROLE_LABELS[data.role];
  const until = formatDate.format(data.expiresAt);
  const greeting = data.name ? `Bonjour ${data.name},` : "Bonjour,";
  const subject = "Votre accès à DIWAA Finance · DigiWomen School";
  const logo =
    data.origin?.startsWith("https://")
      ? `<img src="${escapeHtml(data.origin)}/brand/digiwomen-school-logo-creme.png" width="160" alt="DigiWomen School" style="display:block;margin:0 auto 8px;border:0;height:auto">`
      : "";

  const text = [
    greeting,
    "",
    `Votre compte DIWAA Finance (outil interne de DigiWomen School) est prêt à être créé, avec le profil « ${role} ».`,
    "",
    `Créez votre compte et choisissez votre mot de passe ici : ${data.link}`,
    "",
    `Code d'invitation : ${data.code}`,
    `Valable jusqu'au ${until}, pour une seule utilisation.`,
    "",
    "Si vous n'attendiez pas cette invitation, ignorez simplement cet e-mail.",
    "",
    "DIWAA Finance · DigiWomen School",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#ebe4d1;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ebe4d1;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f3eee2;border-radius:24px;overflow:hidden">
<tr><td style="background:#0f3d36;padding:28px 24px;text-align:center;color:#f3eee2">
${logo}<div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:.85">DIWAA Finance</div>
</td></tr>
<tr><td style="padding:32px 28px">
<p style="margin:0 0 16px;font-size:16px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Votre compte <strong>DIWAA Finance</strong>, l'outil interne de gestion financière de DigiWomen School, est prêt à être créé avec le profil <strong>${escapeHtml(role)}</strong>.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6">Cliquez sur le bouton ci-dessous pour choisir votre mot de passe.</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px"><tr><td style="background:#0f3d36;border-radius:999px">
<a href="${escapeHtml(data.link)}" style="display:inline-block;padding:14px 32px;color:#f3eee2;font-weight:bold;font-size:14px;letter-spacing:1px;text-decoration:none;text-transform:uppercase">Créer mon compte</a>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ebe4d1;border-radius:16px"><tr><td style="padding:16px;text-align:center">
<div style="font-size:12px;color:#52525b">Code d'invitation</div>
<div style="font-family:'Courier New',monospace;font-size:26px;font-weight:bold;letter-spacing:4px;color:#0a2b26;margin-top:4px">${escapeHtml(data.code)}</div>
<div style="font-size:12px;color:#52525b;margin-top:6px">Valable jusqu'au ${escapeHtml(until)}, une seule fois</div>
</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#52525b">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${escapeHtml(data.link)}" style="color:#15514a;word-break:break-all">${escapeHtml(data.link)}</a></p>
</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:12px;color:#71717a;line-height:1.5">Si vous n'attendiez pas cette invitation, ignorez simplement cet e-mail. Ne transférez pas ce message : le code donne accès à la création de votre compte.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}
