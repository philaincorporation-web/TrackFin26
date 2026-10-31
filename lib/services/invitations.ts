import "server-only";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertCan, type Actor, type Role } from "@/lib/authz/policy";
import { BusinessError } from "@/lib/errors";
import {
  generateInvitationCode,
  hashInvitationCode,
  INVITATION_MAX_ATTEMPTS,
  INVITATION_TTL_DAYS,
} from "@/lib/invitations/code";
import { insertUserWithPassword } from "@/lib/services/user-records";
import { sendEmail, type EmailMessage, type SendResult } from "@/lib/email/mailer";
import { invitationEmail } from "@/lib/email/templates/invitation";
import { createInvitationSchema, invitationLookupSchema, signupSchemaFor } from "@/lib/validation/signup";

/** Message unique : ne révèle pas si l'e-mail est invité ni pourquoi le code est refusé. */
const INVALID = "Invitation introuvable, expirée ou déjà utilisée. Vérifiez l'e-mail et le code, ou demandez une nouvelle invitation.";

const pendingWhere = () => ({ acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } });

// ---------------------------------------------------------------------------
// Côté administrateur
// ---------------------------------------------------------------------------

export async function createInvitation(actor: Actor, input: unknown) {
  assertCan(actor, "users.manage");
  const data = createInvitationSchema.parse(input);
  const code = generateInvitationCode();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await db.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
      throw new BusinessError("Un compte existe déjà avec cette adresse e-mail.");
    }
    // Une seule invitation valable par e-mail : les précédentes sont révoquées.
    await tx.invitation.updateMany({
      where: { email: data.email, ...pendingWhere() },
      data: { revokedAt: new Date() },
    });
    const created = await tx.invitation.create({
      data: {
        email: data.email,
        role: data.role,
        name: data.name || null,
        codeHash: hashInvitationCode(code),
        invitedById: actor.id,
        expiresAt,
      },
    });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "invitation.create",
      entityType: "invitation",
      entityId: created.id,
      after: { email: created.email, role: created.role, expiresAt: created.expiresAt }, // jamais le code
    });
    return created;
  });

  // Le code en clair n'est renvoyé qu'une fois, pour être transmis à la personne.
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role as Role,
    name: invitation.name,
    code,
    expiresAt,
  };
}

export type IssuedInvitation = Awaited<ReturnType<typeof createInvitation>>;

/**
 * Envoie l'invitation par e-mail à la personne. Appelée APRÈS l'enregistrement
 * de l'invitation : un échec d'envoi ne l'annule pas, l'administrateur garde
 * le code et le lien à transmettre à la main. Chaque tentative est auditée
 * (sans le code).
 */
export async function deliverInvitation(
  actor: Actor,
  invitation: IssuedInvitation,
  origin: string,
  send: (message: EmailMessage) => Promise<SendResult> = sendEmail,
) {
  assertCan(actor, "users.manage");
  const link = `${origin}/creer-compte?${new URLSearchParams({ email: invitation.email, code: invitation.code })}`;
  const content = invitationEmail({ ...invitation, link, origin });
  const result = await send({ to: { email: invitation.email, name: invitation.name }, ...content });

  await recordAudit(db, {
    actorId: actor.id,
    action: result.sent ? "invitation.email_sent" : "invitation.email_failed",
    entityType: "invitation",
    entityId: invitation.id,
    after: result.sent ? { to: invitation.email } : { to: invitation.email, reason: result.reason },
  });
  return { link, email: result };
}

/** Renvoi : nouvelle invitation (nouveau code, 7 jours) pour le même e-mail et le même profil ; l'ancienne est révoquée. */
export async function reissueInvitation(actor: Actor, invitationId: string) {
  assertCan(actor, "users.manage");
  const previous = await db.invitation.findFirst({
    where: { id: invitationId, acceptedAt: null },
    select: { email: true, role: true, name: true },
  });
  if (!previous) throw new BusinessError("Invitation introuvable ou déjà utilisée.");
  return createInvitation(actor, { email: previous.email, role: previous.role, name: previous.name ?? undefined });
}

export async function listPendingInvitations(actor: Actor) {
  assertCan(actor, "users.manage");
  return db.invitation.findMany({
    where: pendingWhere(),
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, name: true, expiresAt: true, createdAt: true },
  });
}

export async function revokeInvitation(actor: Actor, invitationId: string) {
  assertCan(actor, "users.manage");
  await db.$transaction(async (tx) => {
    const { count } = await tx.invitation.updateMany({
      where: { id: invitationId, ...pendingWhere() },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new BusinessError("Invitation déjà utilisée, expirée ou révoquée.");
    await recordAudit(tx, { actorId: actor.id, action: "invitation.revoke", entityType: "invitation", entityId: invitationId });
  });
}

// ---------------------------------------------------------------------------
// Côté personne invitée (non connectée)
// ---------------------------------------------------------------------------

/**
 * Vérifie le couple e-mail + code. Un code erroné pour un e-mail réellement
 * invité est compté ; au-delà de INVITATION_MAX_ATTEMPTS l'invitation est
 * révoquée (protection contre l'essai de codes en série).
 */
async function findValidInvitation(email: string, code: string) {
  const invitation = await db.invitation.findUnique({ where: { codeHash: hashInvitationCode(code) } });
  const valid =
    invitation &&
    invitation.email === email &&
    !invitation.acceptedAt &&
    !invitation.revokedAt &&
    invitation.expiresAt > new Date();
  if (valid) return invitation;

  const pending = await db.invitation.findFirst({ where: { email, ...pendingWhere() } });
  if (pending) {
    const attempts = pending.failedAttempts + 1;
    await db.invitation.update({
      where: { id: pending.id },
      data: { failedAttempts: attempts, revokedAt: attempts >= INVITATION_MAX_ATTEMPTS ? new Date() : null },
    });
  }
  throw new BusinessError(INVALID);
}

/** Étape 1 : la personne saisit son e-mail et son code ; on lui présente son formulaire. */
export async function checkInvitation(input: unknown) {
  const { email, code } = invitationLookupSchema.parse(input);
  const invitation = await findValidInvitation(email, code);
  return { email: invitation.email, role: invitation.role as Role, name: invitation.name ?? "" };
}

/** Étape 2 : création du compte avec le profil fixé par l'invitation (jamais par le formulaire). */
export async function acceptInvitation(input: unknown) {
  const lookup = invitationLookupSchema.parse(input);
  const invitation = await findValidInvitation(lookup.email, lookup.code);
  const role = invitation.role as Role;
  const data = signupSchemaFor(role).parse(input);

  return db.$transaction(async (tx) => {
    // Verrou optimiste : une invitation ne peut être consommée qu'une fois.
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, ...pendingWhere() },
      data: { acceptedAt: new Date() },
    });
    if (count === 0) throw new BusinessError(INVALID);
    if (await tx.user.findUnique({ where: { email: invitation.email }, select: { id: true } })) {
      throw new BusinessError("Un compte existe déjà avec cette adresse e-mail. Connectez-vous.");
    }

    const user = await insertUserWithPassword(tx, {
      name: data.name,
      email: invitation.email,
      role,
      password: data.password,
      phone: data.phone,
      jobTitle: data.jobTitle,
    });
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedUserId: user.id } });
    await recordAudit(tx, {
      actorId: user.id,
      action: "user.signup_invitation",
      entityType: "user",
      entityId: user.id,
      after: { email: user.email, role: user.role, invitationId: invitation.id, invitedById: invitation.invitedById },
    });
    return { email: user.email, password: data.password };
  });
}
