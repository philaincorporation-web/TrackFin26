import { z } from "zod";
import type { Role } from "@/lib/authz/policy";
import { isWellFormedInvitationCode } from "@/lib/invitations/code";
import { emailSchema, passwordSchema } from "@/lib/validation/users";

/**
 * Formulaire de création de compte propre à chaque profil. Les champs communs
 * (nom, téléphone, mot de passe + confirmation) sont complétés par ceux du
 * profil. Modifier ici suffit : l'interface et la validation serveur suivent.
 */
export type SignupProfile = {
  title: string;
  intro: string;
  /** Fonction / poste : demandé et obligatoire ou non selon le profil. */
  jobTitle: { show: false } | { show: true; required: boolean; label: string; placeholder: string };
  /** Ce que le profil pourra faire, affiché avant validation. */
  capabilities: string[];
};

export const SIGNUP_PROFILES: Record<Role, SignupProfile> = {
  DIRECTRICE: {
    title: "Compte Directrice générale",
    intro: "Accès de supervision à l'ensemble des finances de DigiWomen School.",
    jobTitle: { show: false },
    capabilities: [
      "Consulter les indicateurs, recettes, dépenses, factures et justificatifs",
      "Annoter les pièces et échanger avec l'équipe",
      "Valider les bulletins de paie et recevoir les alertes",
    ],
  },
  ADMIN: {
    title: "Compte Administrateur général",
    intro: "Supervision des opérations et gestion des accès à DIWAA Finance.",
    jobTitle: { show: false },
    capabilities: [
      "Superviser les opérations et consulter les justificatifs",
      "Confirmer certaines dépenses (facultatif, non bloquant)",
      "Inviter les utilisateurs et gérer leurs profils",
    ],
  },
  SECRETAIRE: {
    title: "Compte Secrétaire",
    intro: "Gestion opérationnelle des recettes, des dépenses et de la paie.",
    jobTitle: { show: true, required: false, label: "Intitulé du poste", placeholder: "Ex. Secrétaire administrative" },
    capabilities: [
      "Créer les factures et enregistrer les encaissements",
      "Vérifier, valider et comptabiliser les dépenses",
      "Préparer les bulletins et enregistrer les versements de salaire",
    ],
  },
  COLLABORATEUR: {
    title: "Compte Collaborateur",
    intro: "Déclarez vos dépenses et suivez vos remboursements et bulletins.",
    jobTitle: { show: true, required: true, label: "Poste / fonction", placeholder: "Ex. Formatrice, chargée de projet" },
    capabilities: [
      "Déclarer vos dépenses et joindre vos justificatifs (photo ou fichier)",
      "Suivre leur statut et répondre aux observations",
      "Consulter vos propres bulletins de salaire",
    ],
  },
};

export const invitationLookupSchema = z.object({
  email: emailSchema,
  code: z.string().trim().refine(isWellFormedInvitationCode, "Code d'invitation invalide (8 caractères, ex. K7P4-M2QX)"),
});
export type InvitationLookupInput = z.infer<typeof invitationLookupSchema>;

const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || /^\+?[0-9 ().-]{6,}$/.test(v), "Numéro de téléphone invalide");

/** Schéma complet de création de compte pour un profil donné. */
export function signupSchemaFor(role: Role) {
  const profile = SIGNUP_PROFILES[role];
  const jobTitle =
    profile.jobTitle.show && profile.jobTitle.required
      ? z.string().trim().min(2, "Champ requis").max(120)
      : z.string().trim().max(120).optional();

  return invitationLookupSchema
    .extend({
      name: z.string().trim().min(2, "Nom complet requis").max(120),
      phone: phoneSchema.optional(),
      jobTitle,
      password: passwordSchema,
      passwordConfirm: z.string(),
    })
    .refine((v) => v.password === v.passwordConfirm, {
      path: ["passwordConfirm"],
      message: "Les deux mots de passe ne correspondent pas",
    });
}
export type SignupInput = z.infer<ReturnType<typeof signupSchemaFor>>;

/** Invitation créée par l'administrateur. */
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(["DIRECTRICE", "ADMIN", "SECRETAIRE", "COLLABORATEUR"], { error: "Profil invalide" }),
  name: z.string().trim().max(120).optional(),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
