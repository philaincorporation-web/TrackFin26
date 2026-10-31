import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email/mailer";

const message = { to: { email: "dest@test.invalid" }, subject: "Test", html: "<p>Test</p>", text: "Test" };

afterEach(() => vi.unstubAllEnvs());

describe("envoi SMTP", () => {
  it("sans configuration : n'échoue pas, explique les variables manquantes", async () => {
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASSWORD", "");
    const r = await sendEmail(message);
    expect(r.sent).toBe(false);
    if (!r.sent) expect(r.reason).toMatch(/SMTP_HOST, SMTP_USER, SMTP_PASSWORD/);
  });

  it("serveur injoignable : n'échoue pas, message clair, sans attendre indéfiniment", async () => {
    vi.stubEnv("SMTP_HOST", "127.0.0.1");
    vi.stubEnv("SMTP_PORT", "2");
    vi.stubEnv("SMTP_USER", "u@test.invalid");
    vi.stubEnv("SMTP_PASSWORD", "x");
    const started = Date.now();
    const r = await sendEmail(message);
    expect(r).toEqual({ sent: false, reason: "Impossible de joindre le serveur d'envoi pour le moment." });
    expect(Date.now() - started).toBeLessThan(20_000);
  }, 30_000);
});
