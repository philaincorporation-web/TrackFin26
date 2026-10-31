import { z } from "zod";
import { ROLES } from "@/lib/authz/policy";

/** Schémas partagés client (React Hook Form) et serveur (validation faisant foi). */

export const PASSWORD_MIN = 10;

/**
 * Adresse e-mail : espaces retirés et minuscules AVANT la vérification du
 * format (avec Zod 4, `z.email().trim()` vérifierait d'abord, et refuserait
 * « nom@exemple.com » collé avec un espace).
 */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide"));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Au moins ${PASSWORD_MIN} caractères`)
  .max(128, "128 caractères maximum");

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  email: emailSchema,
  role: z.enum(ROLES, { error: "Rôle invalide" }),
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserAccessSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES, { error: "Rôle invalide" }),
  active: z.boolean(),
});
export type UpdateUserAccessInput = z.infer<typeof updateUserAccessSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});
export type SignInInput = z.infer<typeof signInSchema>;
