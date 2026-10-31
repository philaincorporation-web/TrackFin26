import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { ForbiddenError, type Actor } from "@/lib/authz/policy";
import { BusinessError } from "@/lib/errors";
import { INVITATION_MAX_ATTEMPTS } from "@/lib/invitations/code";
import {
  acceptInvitation,
  checkInvitation,
  createInvitation,
  deliverInvitation,
  reissueInvitation,
  revokeInvitation,
} from "@/lib/services/invitations";
import type { EmailMessage } from "@/lib/email/mailer";
import { insertUserWithPassword } from "@/lib/services/user-records";

const run = randomBytes(4).toString("hex");
const email = (label: string) => `${label}-${run}@test.invalid`;
const WRONG_CODE = "ZZZZ-ZZZZ";

let admin: Actor;

beforeAll(async () => {
  const user = await db.$transaction((tx) =>
    insertUserWithPassword(tx, { name: "Admin Intégration", email: email("admin"), role: "ADMIN", password: "motdepasse-admin" }),
  );
  admin = { id: user.id, role: "ADMIN" };
});

describe("invitations : du code à la création du compte", () => {
  it("parcours nominal : invitation → vérification → compte créé avec le profil imposé", async () => {
    const inv = await createInvitation(admin, { email: email("collab"), role: "COLLABORATEUR", name: "Awa" });
    expect(inv.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    const checked = await checkInvitation({ email: inv.email, code: inv.code.toLowerCase() });
    expect(checked).toMatchObject({ role: "COLLABORATEUR", name: "Awa" });

    // Tentative d'élévation : le profil envoyé par le formulaire est ignoré.
    await acceptInvitation({
      email: inv.email,
      code: inv.code,
      role: "ADMIN",
      name: "Awa Test",
      jobTitle: "Formatrice",
      password: "motdepasse-solide",
      passwordConfirm: "motdepasse-solide",
    });
    const user = await db.user.findUniqueOrThrow({ where: { email: inv.email } });
    expect(user.role).toBe("COLLABORATEUR");
    expect(user.jobTitle).toBe("Formatrice");

    const account = await db.account.findFirstOrThrow({ where: { userId: user.id } });
    expect(account.providerId).toBe("credential");
    expect(account.password).not.toContain("motdepasse"); // haché

    const audit = await db.auditEvent.findMany({ where: { entityId: user.id, action: "user.signup_invitation" } });
    expect(audit).toHaveLength(1);
  });

  it("un code ne sert qu'une fois", async () => {
    const inv = await createInvitation(admin, { email: email("unique"), role: "SECRETAIRE" });
    const body = { email: inv.email, code: inv.code, name: "Une Fois", password: "motdepasse-123", passwordConfirm: "motdepasse-123" };
    await acceptInvitation(body);
    await expect(acceptInvitation(body)).rejects.toBeInstanceOf(BusinessError);
  });

  it("le code doit correspondre à l'e-mail invité", async () => {
    const inv = await createInvitation(admin, { email: email("lie"), role: "DIRECTRICE" });
    await expect(checkInvitation({ email: email("autre"), code: inv.code })).rejects.toBeInstanceOf(BusinessError);
  });

  it(`révoque l'invitation après ${INVITATION_MAX_ATTEMPTS} codes erronés`, async () => {
    const inv = await createInvitation(admin, { email: email("bruteforce"), role: "COLLABORATEUR" });
    for (let i = 0; i < INVITATION_MAX_ATTEMPTS; i++) {
      await expect(checkInvitation({ email: inv.email, code: WRONG_CODE })).rejects.toBeInstanceOf(BusinessError);
    }
    // Même le bon code ne fonctionne plus.
    await expect(checkInvitation({ email: inv.email, code: inv.code })).rejects.toBeInstanceOf(BusinessError);
  });

  it("une nouvelle invitation remplace la précédente pour le même e-mail", async () => {
    const first = await createInvitation(admin, { email: email("double"), role: "COLLABORATEUR" });
    const second = await createInvitation(admin, { email: email("double"), role: "SECRETAIRE" });
    await expect(checkInvitation({ email: first.email, code: first.code })).rejects.toBeInstanceOf(BusinessError);
    expect(await checkInvitation({ email: second.email, code: second.code })).toMatchObject({ role: "SECRETAIRE" });
  });

  it("une invitation révoquée est refusée", async () => {
    const inv = await createInvitation(admin, { email: email("revoque"), role: "COLLABORATEUR" });
    await revokeInvitation(admin, inv.id);
    await expect(checkInvitation({ email: inv.email, code: inv.code })).rejects.toBeInstanceOf(BusinessError);
  });

  it("refuse d'inviter un e-mail qui a déjà un compte", async () => {
    await expect(createInvitation(admin, { email: email("admin"), role: "COLLABORATEUR" })).rejects.toBeInstanceOf(
      BusinessError,
    );
  });

  it("seul l'administrateur peut inviter", async () => {
    for (const role of ["DIRECTRICE", "SECRETAIRE", "COLLABORATEUR"] as const) {
      await expect(createInvitation({ id: admin.id, role }, { email: email(`x-${role}`), role: "ADMIN" })).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    }
  });

  it("le code en clair n'est jamais stocké", async () => {
    const inv = await createInvitation(admin, { email: email("hash"), role: "COLLABORATEUR" });
    const row = await db.invitation.findUniqueOrThrow({ where: { id: inv.id } });
    expect(JSON.stringify(row)).not.toContain(inv.code.replace("-", ""));
    const audit = await db.auditEvent.findFirstOrThrow({ where: { entityId: inv.id } });
    expect(JSON.stringify({ before: audit.before, after: audit.after })).not.toContain(inv.code);
  });
});

describe("envoi de l'invitation par e-mail", () => {
  const ORIGIN = "https://track-fin26.vercel.app";

  it("envoi réussi : e-mail au bon destinataire avec lien et code, audit sans le code", async () => {
    const inv = await createInvitation(admin, { email: email("mail-ok"), role: "SECRETAIRE", name: "Mariam" });
    const sent: EmailMessage[] = [];
    const out = await deliverInvitation(admin, inv, ORIGIN, async (m) => {
      sent.push(m);
      return { sent: true, messageId: "test" };
    });
    expect(out.email.sent).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toEqual({ email: inv.email, name: "Mariam" });
    expect(sent[0].text).toContain(inv.code);
    expect(sent[0].text).toContain(`${ORIGIN}/creer-compte?`);
    const audit = await db.auditEvent.findFirstOrThrow({ where: { entityId: inv.id, action: "invitation.email_sent" } });
    expect(JSON.stringify(audit.after)).not.toContain(inv.code);
  });

  it("échec d'envoi : l'invitation reste valable et l'échec est audité avec sa raison", async () => {
    const inv = await createInvitation(admin, { email: email("mail-ko"), role: "COLLABORATEUR" });
    const out = await deliverInvitation(admin, inv, ORIGIN, async () => ({ sent: false, reason: "Serveur injoignable." }));
    expect(out.email).toEqual({ sent: false, reason: "Serveur injoignable." });
    expect(await checkInvitation({ email: inv.email, code: inv.code })).toMatchObject({ role: "COLLABORATEUR" });
    const audit = await db.auditEvent.findFirstOrThrow({ where: { entityId: inv.id, action: "invitation.email_failed" } });
    expect(audit.after).toMatchObject({ reason: "Serveur injoignable." });
  });

  it("renvoi : nouveau code, même e-mail et même profil, l'ancien code est invalidé", async () => {
    const first = await createInvitation(admin, { email: email("renvoi"), role: "DIRECTRICE", name: "Mme D." });
    const second = await reissueInvitation(admin, first.id);
    expect(second.code).not.toBe(first.code);
    expect(second).toMatchObject({ email: first.email, role: "DIRECTRICE", name: "Mme D." });
    await expect(checkInvitation({ email: first.email, code: first.code })).rejects.toBeInstanceOf(BusinessError);
    expect(await checkInvitation({ email: second.email, code: second.code })).toMatchObject({ role: "DIRECTRICE" });
  });

  it("seul l'administrateur peut renvoyer une invitation", async () => {
    const inv = await createInvitation(admin, { email: email("renvoi-interdit"), role: "COLLABORATEUR" });
    await expect(reissueInvitation({ id: admin.id, role: "SECRETAIRE" }, inv.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
