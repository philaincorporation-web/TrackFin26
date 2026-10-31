import { describe, expect, it } from "vitest";
import { readEmailConfig } from "@/lib/email/config";
import { escapeHtml, invitationEmail } from "@/lib/email/templates/invitation";

describe("configuration SMTP", () => {
  it("signale les variables manquantes", () => {
    const r = readEmailConfig({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"]);
  });

  it("configuration Gmail : port 465 sécurisé, espaces du mot de passe d'application retirés", () => {
    const r = readEmailConfig({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "ecole@gmail.com", SMTP_PASSWORD: "abcd efgh ijkl mnop" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.config).toMatchObject({ port: 465, secure: true, password: "abcdefghijklmnop" });
      expect(r.config.from.address).toBe("ecole@gmail.com");
    }
  });

  it("port 587 : STARTTLS (pas de TLS immédiat)", () => {
    const r = readEmailConfig({ SMTP_HOST: "h", SMTP_USER: "u", SMTP_PASSWORD: "p", SMTP_PORT: "587" });
    expect(r.ok && r.config.secure).toBe(false);
  });
});

describe("e-mail d'invitation", () => {
  const data = {
    name: "Awa Mboumba",
    role: "SECRETAIRE" as const,
    code: "K7P4-M2QX",
    link: "https://track-fin26.vercel.app/creer-compte?email=awa%40exemple.com&code=K7P4-M2QX",
    expiresAt: new Date("2026-11-07T12:00:00Z"),
    origin: "https://track-fin26.vercel.app",
  };

  it("contient le lien, le code, le profil et la date d'expiration (HTML et texte)", () => {
    const { subject, html, text } = invitationEmail(data);
    expect(subject).toContain("DIWAA Finance");
    for (const body of [html, text]) {
      expect(body).toContain("K7P4-M2QX");
      expect(body).toContain("Secrétaire");
      expect(body).toContain("7 novembre 2026");
    }
    expect(text).toContain(data.link);
    expect(html).toContain(escapeHtml(data.link));
    expect(html).toContain("/brand/digiwomen-school-logo-creme.png");
  });

  it("échappe un nom contenant du HTML", () => {
    const { html } = invitationEmail({ ...data, name: '<script>alert("x")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("pas de logo hors HTTPS (développement local)", () => {
    expect(invitationEmail({ ...data, origin: "http://localhost:3000" }).html).not.toContain("<img");
  });
});
